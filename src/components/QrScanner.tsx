
import { useState, useRef, useEffect } from "react";
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase, processWithdrawalVerification } from "@/integrations/supabase/client";
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
      
      // Utiliser la fonction processWithdrawalVerification
      const result = await processWithdrawalVerification(code, user.id);
      
      // Success message and refresh data
      toast({
        title: "Retrait confirmé",
        description: `Vous avez traité un retrait de ${result.amount} FCFA. Après les frais, vous avez reçu ${result.amount - (result.amount * 0.025)} FCFA.`,
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
        description: error instanceof Error ? error.message : "Une erreur s'est produite lors du traitement du retrait.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-4 px-0">
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')}
            className="text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-semibold">Scanner QR Code</h2>
          <div className="w-9"></div>
        </div>
      
        <div className="space-y-6">
          <div className="card border rounded-lg shadow-md p-4 bg-white">
            <Button
              variant={isScanning ? "destructive" : "default"}
              onClick={handleScanToggle}
              disabled={isProcessing}
              className="w-full mb-4"
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

            {isScanning && (
              <div ref={qrRef} id="qr-reader" className="w-full max-w-md mx-auto mb-4" />
            )}

            <div className="mb-4">
              <Label htmlFor="verificationCode" className="mb-1 block">Code de vérification</Label>
              <div className="relative">
                <Input
                  type="text"
                  id="verificationCode"
                  placeholder="Entrez le code de vérification"
                  value={verificationCode}
                  onChange={handleVerificationCodeChange}
                  disabled={isScanning || isProcessing}
                  className="pr-10"
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
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {isProcessing ? "Traitement..." : "Valider le Code"}
            </Button>
          </div>
          
          <div className="text-center text-sm text-gray-600">
            <p>Scannez ou entrez le code de vérification fourni par la personne qui souhaite retirer de l'argent.</p>
            <p className="mt-1">Une fois le code validé, le montant sera crédité sur votre compte.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QrScanner;
