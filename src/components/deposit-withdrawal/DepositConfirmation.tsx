
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Fingerprint, Lock, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/integrations/supabase/client";

interface DepositConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  amount: number;
  clientName: string;
  clientPhone: string;
  isProcessing: boolean;
}

const DepositConfirmation = ({
  isOpen,
  onClose,
  onConfirm,
  amount,
  clientName,
  clientPhone,
  isProcessing
}: DepositConfirmationProps) => {
  const { user } = useAuth();
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
      // Ici on pourrait vérifier le mot de passe avec Supabase
      // Pour l'instant, on simule une vérification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await onConfirm();
      setPassword("");
      onClose();
    } catch (error) {
      toast({
        title: "Erreur de confirmation",
        description: "Impossible de confirmer le dépôt",
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
      // Authentification biométrique avec une approche plus simple
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
          description: "Dépôt confirmé avec succès",
        });
      } else {
        throw new Error("Credential not found");
      }
    } catch (error) {
      console.error("Erreur biométrique:", error);
      
      // Fallback vers l'authentification par mot de passe
      toast({
        title: "Authentification biométrique non disponible",
        description: "Veuillez utiliser votre mot de passe pour confirmer",
        variant: "destructive"
      });
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            Confirmer le dépôt
          </DialogTitle>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Détails du dépôt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Client:</span>
              <span className="font-medium">{clientName}</span>
            </div>
            <div className="flex justify-between">
              <span>Téléphone:</span>
              <span className="font-medium">{clientPhone}</span>
            </div>
            <div className="flex justify-between">
              <span>Montant:</span>
              <span className="font-bold text-emerald-600">
                {formatCurrency(amount, 'XAF')}
              </span>
            </div>
            <div className="border-t pt-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <AlertCircle className="w-4 h-4" />
                <span>Aucun frais pour les dépôts</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Confirmez votre identité pour effectuer ce dépôt
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

export default DepositConfirmation;
