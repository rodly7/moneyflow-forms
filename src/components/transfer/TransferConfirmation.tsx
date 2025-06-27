
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Fingerprint, Lock, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, calculateFee } from "@/integrations/supabase/client";

interface TransferConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  transferData: {
    amount: number;
    recipientName: string;
    recipientPhone: string;
    recipientCountry: string;
    senderCountry: string;
  };
  isProcessing: boolean;
}

const TransferConfirmation = ({
  isOpen,
  onClose,
  onConfirm,
  transferData,
  isProcessing
}: TransferConfirmationProps) => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);

  // Vérifier si l'authentification biométrique est supportée
  useState(() => {
    if (window.PublicKeyCredential && navigator.credentials) {
      setBiometricSupported(true);
    }
  });

  const handlePasswordConfirmation = async () => {
    if (!password.trim()) {
      toast({
        title: "Mot de passe requis",
        description: "Veuillez entrer votre mot de passe pour confirmer",
        variant: "destructive"
      });
      return;
    }

    setIsConfirming(true);
    try {
      // Simulation de vérification du mot de passe
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await onConfirm();
      setPassword("");
      onClose();
    } catch (error) {
      toast({
        title: "Erreur de confirmation",
        description: "Impossible de confirmer le transfert",
        variant: "destructive"
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleBiometricConfirmation = async () => {
    if (!biometricSupported) {
      toast({
        title: "Biométrie non supportée",
        description: "Votre appareil ne supporte pas l'authentification biométrique",
        variant: "destructive"
      });
      return;
    }

    setIsConfirming(true);
    try {
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          allowCredentials: [],
          timeout: 60000,
          userVerification: "required"
        }
      });

      if (credential) {
        await onConfirm();
        onClose();
        toast({
          title: "Authentification réussie",
          description: "Transfert confirmé avec succès",
        });
      } else {
        throw new Error("Credential not found");
      }
    } catch (error) {
      console.error("Erreur biométrique:", error);
      
      toast({
        title: "Authentification biométrique non disponible",
        description: "Veuillez utiliser votre mot de passe pour confirmer",
        variant: "destructive"
      });
    } finally {
      setIsConfirming(false);
    }
  };

  // Calculer les frais
  const { fee: fees, rate } = calculateFee(
    transferData.amount, 
    transferData.senderCountry, 
    transferData.recipientCountry,
    userRole === 'agent' ? 'agent' : 'user'
  );
  const total = transferData.amount + fees;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            Confirmer le transfert
          </DialogTitle>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Détails du transfert</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Destinataire:</span>
              <span className="font-medium">{transferData.recipientName}</span>
            </div>
            <div className="flex justify-between">
              <span>Téléphone:</span>
              <span className="font-medium">{transferData.recipientPhone}</span>
            </div>
            <div className="flex justify-between">
              <span>Pays:</span>
              <span className="font-medium">{transferData.recipientCountry}</span>
            </div>
            <div className="flex justify-between">
              <span>Montant:</span>
              <span className="font-bold text-emerald-600">
                {formatCurrency(transferData.amount, 'XAF')}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Frais ({rate}%):</span>
              <span className="font-medium text-orange-600">
                {formatCurrency(fees, 'XAF')}
              </span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span className="text-emerald-600">
                  {formatCurrency(total, 'XAF')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Confirmez votre identité pour effectuer ce transfert
            </p>
          </div>

          {/* Authentification par mot de passe en priorité */}
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="Entrez votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12"
              onKeyPress={(e) => e.key === 'Enter' && handlePasswordConfirmation()}
            />
            
            <Button
              onClick={handlePasswordConfirmation}
              disabled={isConfirming || isProcessing || !password.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 h-12"
            >
              {isConfirming ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span>Vérification...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Lock className="mr-2 h-5 w-5" />
                  <span>Confirmer avec mot de passe</span>
                </div>
              )}
            </Button>
          </div>

          {/* Authentification biométrique alternative */}
          {biometricSupported && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Ou
                  </span>
                </div>
              </div>

              <Button
                onClick={handleBiometricConfirmation}
                disabled={isConfirming || isProcessing}
                variant="outline"
                className="w-full h-12"
              >
                {isConfirming ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    <span>Authentification...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Fingerprint className="mr-2 h-5 w-5" />
                    <span>Utiliser Face ID / Empreinte</span>
                  </div>
                )}
              </Button>
            </>
          )}

          <Button
            variant="outline"
            onClick={onClose}
            disabled={isConfirming || isProcessing}
            className="w-full"
          >
            Annuler
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransferConfirmation;
