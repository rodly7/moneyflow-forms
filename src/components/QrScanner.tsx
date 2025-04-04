
import { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface QrScannerProps {
  onClose: () => void;
}

interface WithdrawalData {
  withdrawalId: string;
  amount?: string;
  userId?: string;
}

const QrScanner = ({ onClose }: QrScannerProps) => {
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [scannedData, setScannedData] = useState<WithdrawalData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
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
      
      const adminAccount = "+221773637752";
      const adminUserId = await getAdminUserId(adminAccount);
      
      // Execute the withdrawal process
      // 1. Update withdrawal status to 'completed'
      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({ 
          status: 'completed', 
          updated_at: new Date().toISOString()
        })
        .eq('id', withdrawal.id);
      
      if (updateError) throw updateError;
      
      // 2. Calculate fee amount based on transaction type
      const feeRate = 0.025; // Standard 2.5% fee
      const feeAmount = withdrawal.amount * feeRate;
      
      // 3. Transfer the amount from requester to the current user
      // Add funds to the processor's account
      const { error: processorBalanceError } = await supabase
        .rpc('increment_balance', { 
          user_id: user.id, 
          amount: withdrawal.amount - feeAmount
        });
      
      if (processorBalanceError) {
        throw new Error("Erreur lors du transfert des fonds au processeur");
      }
      
      // 4. Credit fees to the admin account
      if (adminUserId) {
        const { error: adminBalanceError } = await supabase
          .rpc('increment_balance', { 
            user_id: adminUserId, 
            amount: feeAmount
          });
        
        if (adminBalanceError) {
          console.error("Erreur lors du crédit des frais à l'admin", adminBalanceError);
          // Continue the process even if fee transfer fails
        }
      }
      
      toast({
        title: "Retrait confirmé",
        description: `Vous avez reçu ${withdrawal.amount - feeAmount} XAF`,
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

  const verifyWithCode = async () => {
    if (!verificationCode || !user?.id) return;
    
    setProcessing(true);
    
    try {
      // Process the withdrawal using the verification code
      const result = await processWithdrawalVerification(verificationCode, user.id);
      
      if (!result) {
        throw new Error("Code de vérification invalide ou déjà utilisé");
      }
      
      const adminAccount = "+221773637752";
      const adminUserId = await getAdminUserId(adminAccount);
      
      // Calculate fees
      const feeRate = 0.025; // Standard 2.5% fee
      const feeAmount = result.amount * feeRate;
      
      // Call the decrement_balance edge function to deduct fees
      const { data: deductResponse, error: deductError } = await fetch(
        "https://msasycggbiwyxlczknwj.supabase.co/functions/v1/decrement-balance",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabase.auth.getSession().then(res => res.data.session?.access_token)}`
          },
          body: JSON.stringify({
            user_id: user.id,
            amount: feeAmount
          })
        }
      ).then(res => res.json());
      
      if (deductError) {
        console.error("Erreur lors de la déduction des frais:", deductError);
      }
      
      // Credit fees to admin account
      if (adminUserId) {
        const { error: adminBalanceError } = await supabase
          .rpc('increment_balance', { 
            user_id: adminUserId, 
            amount: feeAmount
          });
        
        if (adminBalanceError) {
          console.error("Erreur lors du crédit des frais à l'admin", adminBalanceError);
        }
      }
      
      toast({
        title: "Retrait confirmé",
        description: `Vous avez reçu ${result.amount - feeAmount} XAF`,
      });
      
      // Refresh user data to show updated balance
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Close scanner
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error processing withdrawal with code:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  // Helper function to get admin user ID by phone number
  const getAdminUserId = async (phoneNumber: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', phoneNumber)
        .single();
      
      if (error || !data) {
        console.error("Error fetching admin user:", error);
        return null;
      }
      
      return data.id;
    } catch (error) {
      console.error("Error in getAdminUserId:", error);
      return null;
    }
  };

  const restartScanner = () => {
    setScanning(true);
    setMessage('');
    setScannedData(null);
    setVerificationCode('');
  };

  return (
    <div className="w-full flex flex-col items-center">
      {scanning ? (
        <div id="qr-reader" className="w-full max-w-xs" />
      ) : (
        <div className="w-full max-w-xs">
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-center">
              Vérification du retrait
            </h2>
            
            <div className="space-y-2">
              <Label htmlFor="verification-code">Code de vérification</Label>
              <Input
                id="verification-code"
                placeholder="Entrez le code à 6 chiffres"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="text-center text-lg tracking-widest"
                maxLength={6}
              />
            </div>
            
            <Button
              onClick={verifyWithCode}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={processing || verificationCode.length < 6}
            >
              {processing ? "Traitement..." : "Vérifier le code"}
            </Button>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-2 text-gray-500 text-sm">ou</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
            
            <Button
              variant="outline"
              onClick={() => setScanning(true)}
              className="w-full"
            >
              Scanner un QR code
            </Button>
          </div>
        </div>
      )}
      
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
