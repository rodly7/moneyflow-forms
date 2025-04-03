
import { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface QrScannerProps {
  onClose: () => void;
}

interface WithdrawalData {
  withdrawalId: string;
  amount?: string;
  userId?: string;
}

const QrScanner = ({ onClose }: QrScannerProps) => {
  const [scanning, setScanning] = useState(true);
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [scannedData, setScannedData] = useState<WithdrawalData | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    let html5QrCode: Html5Qrcode;

    const startScanner = async () => {
      html5QrCode = new Html5Qrcode("qr-reader");
      
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          handleScanSuccess,
          (errorMessage) => {
            // Just log errors but don't show to user unless it's a permission issue
            if (errorMessage.includes("permission")) {
              setMessage("Veuillez autoriser l'accès à la caméra");
            }
            console.log(errorMessage);
          }
        );
      } catch (err) {
        console.error("Error starting scanner:", err);
        setMessage("Impossible d'accéder à la caméra");
      }
    };

    if (scanning) {
      startScanner();
    }

    return () => {
      if (html5QrCode?.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [scanning]);

  const handleScanSuccess = async (decodedText: string) => {
    try {
      // Stop scanning after successful scan
      setScanning(false);
      setMessage("Code QR détecté, analyse en cours...");
      
      // Parse QR code data
      const qrData = JSON.parse(decodedText);
      
      if (qrData.action !== 'withdraw' || !qrData.withdrawalId) {
        setMessage("Ce QR code n'est pas valide pour un retrait");
        return;
      }

      setScannedData({
        withdrawalId: qrData.withdrawalId,
        amount: qrData.amount,
        userId: qrData.userId
      });
      
      setMessage(`Retrait de ${qrData.amount || '?'} XAF détecté. Prêt à confirmer.`);
    } catch (error) {
      console.error("Error processing QR code:", error);
      setMessage("Format de QR code non valide");
    }
  };

  const processWithdrawal = async () => {
    if (!scannedData?.withdrawalId || !user?.id) return;
    
    setProcessing(true);
    
    try {
      // First, fetch the withdrawal details to verify it
      const { data: withdrawal, error: fetchError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('id', scannedData.withdrawalId)
        .eq('status', 'pending')
        .single();
      
      if (fetchError || !withdrawal) {
        throw new Error("Ce retrait n'existe pas ou a déjà été traité");
      }
      
      // Ensure the user processing is different from the withdrawal requester
      if (withdrawal.user_id === user.id) {
        throw new Error("Vous ne pouvez pas confirmer votre propre retrait");
      }
      
      // Execute the withdrawal process
      // 1. Update withdrawal status to 'completed'
      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', withdrawal.id);
      
      if (updateError) throw updateError;
      
      // 2. Get the requester's profile to check balance
      const { data: requesterProfile, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', withdrawal.user_id)
        .single();
      
      if (profileError || !requesterProfile) {
        throw new Error("Impossible de vérifier le solde de l'utilisateur");
      }
      
      // 3. Transfer the amount from requester to the current user
      // Update the processor's balance (increment)
      const { error: incrementError } = await supabase
        .from('profiles')
        .update({ balance: supabase.rpc('increment_balance', { amount: withdrawal.amount }) })
        .eq('id', user.id);
      
      if (incrementError) throw incrementError;
      
      toast({
        title: "Retrait confirmé",
        description: `Vous avez reçu ${withdrawal.amount} XAF`,
      });
      
      // Refresh user data to show updated balance
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Close scanner
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const restartScanner = () => {
    setScanning(true);
    setMessage('');
    setScannedData(null);
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div id="qr-reader" className="w-full max-w-xs" />
      
      {message && (
        <div className="mt-4 text-center">
          <p className={scannedData ? "text-green-600 font-medium" : "text-gray-600"}>
            {message}
          </p>
        </div>
      )}
      
      <div className="mt-6 space-y-2 w-full">
        {scannedData ? (
          <Button
            onClick={processWithdrawal}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={processing}
          >
            {processing ? "Traitement..." : "Confirmer le retrait"}
          </Button>
        ) : null}
        
        <Button
          variant="outline"
          onClick={scannedData ? restartScanner : onClose}
          className="w-full"
          disabled={processing}
        >
          {scannedData ? "Scanner un autre code" : "Annuler"}
        </Button>
      </div>
    </div>
  );
};

export default QrScanner;
