
import { useState, useRef, useEffect } from "react";
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase, getAdminUserId } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Copy, QrCode, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const QrScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const qrRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let html5Qrcode: Html5Qrcode | null = null;

    if (isScanning && qrRef.current) {
      html5Qrcode = new Html5Qrcode("qr-reader");
      html5Qrcode
        .start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            setVerificationCode(decodedText);
            setIsScanning(false);
            if (html5Qrcode) {
              html5Qrcode.stop();
            }
          },
          (errorMessage) => {
            console.warn(errorMessage);
          }
        )
        .catch((error) => {
          console.error("QR Code scanning failed:", error);
          toast({
            title: "Erreur de caméra",
            description: "Impossible d'accéder à la caméra. Veuillez vérifier les permissions.",
            variant: "destructive"
          });
          setIsScanning(false);
          if (html5Qrcode) {
            html5Qrcode.stop();
          }
        });
    }

    return () => {
      if (html5Qrcode) {
        html5Qrcode.stop();
      }
    };
  }, [isScanning, toast]);

  const handleScanToggle = () => {
    setIsScanning((prev) => !prev);
    if (!isScanning) {
      setVerificationCode("");
    }
  };

  const handleVerificationCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVerificationCode(e.target.value);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(verificationCode);
    setIsCodeCopied(true);
    setTimeout(() => setIsCodeCopied(false), 2000);
  };

  // Process verification code
  const processCode = async (code: string) => {
    setIsProcessing(true);
    
    try {
      if (!user) {
        toast({
          title: "Erreur d'authentification",
          description: "Vous devez être connecté pour traiter un code.",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }
      
      console.log("Processing verification code:", code);
      
      // Check if the code exists and is valid
      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('verification_code', code)
        .eq('status', 'pending')
        .single();
      
      if (withdrawalError || !withdrawalData) {
        console.error("Error fetching withdrawal:", withdrawalError);
        toast({
          title: "Code invalide",
          description: "Ce code de vérification n'existe pas ou a déjà été utilisé.",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }
      
      // Ensure the processor is different from the requester
      if (withdrawalData.user_id === user.id) {
        toast({
          title: "Action non autorisée",
          description: "Vous ne pouvez pas confirmer votre propre retrait.",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }
      
      // Update withdrawal status to 'completed'
      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({ 
          status: 'completed', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', withdrawalData.id);
      
      if (updateError) {
        console.error("Error updating withdrawal status:", updateError);
        toast({
          title: "Erreur de traitement",
          description: "Une erreur est survenue lors de la mise à jour du statut.",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      // Calculate fee
      const feeRate = 0.025; // Standard 2.5% fee
      const feeAmount = withdrawalData.amount * feeRate;
      
      // Call the decrement_balance edge function to deduct fees
      const { data: deductResponse, error: deductError } = await fetch(
        "https://msasycggbiwyxlczknwj.supabase.co/functions/v1/decrement-balance",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
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
      const adminId = await getAdminUserId();
      if (adminId) {
        const { error: adminFeeError } = await supabase.rpc('increment_balance', {
          user_id: adminId,
          amount: feeAmount
        });
        
        if (adminFeeError) {
          console.error("Erreur lors du crédit des frais à l'admin:", adminFeeError);
        }
      }
      
      // Add funds (minus fees) to the processor's account
      const { error: balanceError } = await supabase.rpc('increment_balance', { 
        user_id: user.id, 
        amount: withdrawalData.amount - feeAmount
      });
      
      if (balanceError) {
        console.error("Error updating processor balance:", balanceError);
        toast({
          title: "Erreur de traitement",
          description: "Une erreur est survenue lors du crédit des fonds.",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      // Success message and refresh data
      toast({
        title: "Retrait confirmé",
        description: `Vous avez traité un retrait de ${withdrawalData.amount} FCFA. Après les frais, vous avez reçu ${withdrawalData.amount - feeAmount} FCFA.`,
      });
      
      // Refresh cache
      queryClient.invalidateQueries({
        queryKey: ['withdrawals']
      });
      queryClient.invalidateQueries({
        queryKey: ['profile']
      });
      
      // Reset form and navigate to home
      setVerificationCode("");
      navigate('/');
      
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors du traitement du retrait.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Scanner QR Code</h2>

      <div className="mb-4">
        <Button
          variant={isScanning ? "destructive" : "outline"}
          onClick={handleScanToggle}
          disabled={isProcessing}
        >
          {isScanning ? (
            <>
              <X className="mr-2 h-4 w-4" />
              Arrêter le Scan
            </>
          ) : (
            <>
              <QrCode className="mr-2 h-4 w-4" />
              {isProcessing ? "Traitement..." : "Démarrer le Scan"}
            </>
          )}
        </Button>
      </div>

      {isScanning && (
        <div ref={qrRef} id="qr-reader" className="w-full max-w-md mx-auto" />
      )}

      <div className="mb-4">
        <Label htmlFor="verificationCode">Code de vérification</Label>
        <div className="relative">
          <Input
            type="text"
            id="verificationCode"
            placeholder="Entrez le code de vérification"
            value={verificationCode}
            onChange={handleVerificationCodeChange}
            disabled={isScanning || isProcessing}
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2"
            onClick={handleCopyCode}
            disabled={!verificationCode || isCodeCopied}
          >
            {isCodeCopied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <Button
        onClick={() => processCode(verificationCode)}
        disabled={!verificationCode || isProcessing}
      >
        {isProcessing ? "Traitement..." : "Valider le Code"}
      </Button>
    </div>
  );
};

export default QrScanner;
