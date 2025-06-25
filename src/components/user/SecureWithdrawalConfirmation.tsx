
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, CheckCircle, XCircle, Eye, EyeOff, Fingerprint } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/integrations/supabase/client";

interface WithdrawalRequest {
  id: string;
  amount: number;
  agent_name: string;
  agent_phone: string;
  created_at: string;
}

interface SecureWithdrawalConfirmationProps {
  request: WithdrawalRequest;
  onClose: () => void;
  onConfirmed: () => void;
}

export const SecureWithdrawalConfirmation = ({ 
  request, 
  onClose, 
  onConfirmed 
}: SecureWithdrawalConfirmationProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [authMethod, setAuthMethod] = useState<'password' | 'biometric'>('password');

  const handlePasswordConfirmation = async () => {
    if (!password) {
      toast({
        title: "Mot de passe requis",
        description: "Veuillez entrer votre mot de passe pour confirmer",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Vérifier le mot de passe avec Supabase Auth
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: password
      });

      if (authError) {
        toast({
          title: "Mot de passe incorrect",
          description: "Veuillez vérifier votre mot de passe",
          variant: "destructive"
        });
        return;
      }

      await processWithdrawal(true);
    } catch (error) {
      console.error("❌ Erreur d'authentification:", error);
      toast({
        title: "Erreur d'authentification",
        description: "Impossible de vérifier votre identité",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBiometricConfirmation = async () => {
    setIsProcessing(true);

    try {
      // Simuler l'authentification biométrique
      // Dans une vraie application, vous utiliseriez l'API WebAuthn
      if (navigator.credentials) {
        toast({
          title: "Authentification biométrique",
          description: "Utilisez votre empreinte digitale ou Face ID",
        });
        
        // Simulation d'une authentification biométrique réussie
        setTimeout(async () => {
          await processWithdrawal(true);
        }, 2000);
      } else {
        toast({
          title: "Biométrie non supportée",
          description: "Veuillez utiliser votre mot de passe",
          variant: "destructive"
        });
        setAuthMethod('password');
      }
    } catch (error) {
      console.error("❌ Erreur biométrique:", error);
      toast({
        title: "Erreur biométrique",
        description: "Veuillez utiliser votre mot de passe",
        variant: "destructive"
      });
      setAuthMethod('password');
    } finally {
      setIsProcessing(false);
    }
  };

  const processWithdrawal = async (approved: boolean) => {
    try {
      const status = approved ? 'approved' : 'rejected';
      const timestamp = approved ? 'approved_at' : 'rejected_at';

      // Mettre à jour le statut de la demande
      const { error: updateError } = await supabase
        .from('withdrawal_requests')
        .update({
          status: status,
          [timestamp]: new Date().toISOString()
        })
        .eq('id', request.id);

      if (updateError) {
        throw updateError;
      }

      if (approved) {
        // Débiter le compte utilisateur
        const { error: debitError } = await supabase.rpc('increment_balance', {
          user_id: user?.id,
          amount: -request.amount
        });

        if (debitError) {
          throw debitError;
        }

        // Créditer le compte agent (si nécessaire)
        // Cette logique peut être ajoutée selon vos besoins

        toast({
          title: "Retrait confirmé",
          description: `Retrait de ${formatCurrency(request.amount, 'XAF')} approuvé avec succès`,
        });
      } else {
        toast({
          title: "Retrait refusé",
          description: "La demande de retrait a été refusée",
        });
      }

      onConfirmed();
    } catch (error) {
      console.error("❌ Erreur lors du traitement:", error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter la demande",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Confirmation de retrait
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informations de la demande */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Montant:</span>
              <span className="font-semibold text-blue-800">
                {formatCurrency(request.amount, 'XAF')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Agent:</span>
              <span className="font-medium">{request.agent_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Téléphone:</span>
              <span className="font-medium">{request.agent_phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Demandé le:</span>
              <span className="font-medium">
                {new Date(request.created_at).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Méthodes d'authentification */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={authMethod === 'password' ? 'default' : 'outline'}
              onClick={() => setAuthMethod('password')}
              className="flex-1"
            >
              Mot de passe
            </Button>
            <Button
              type="button"
              variant={authMethod === 'biometric' ? 'default' : 'outline'}
              onClick={() => setAuthMethod('biometric')}
              className="flex-1"
            >
              <Fingerprint className="w-4 h-4 mr-2" />
              Biométrie
            </Button>
          </div>

          {authMethod === 'password' && (
            <div className="space-y-2">
              <Label htmlFor="password">Confirmez avec votre mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Entrez votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            onClick={authMethod === 'password' ? handlePasswordConfirmation : handleBiometricConfirmation}
            disabled={isProcessing || (authMethod === 'password' && !password)}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Confirmer
          </Button>
          
          <Button
            onClick={() => processWithdrawal(false)}
            disabled={isProcessing}
            variant="destructive"
            className="flex-1"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Refuser
          </Button>
        </div>

        <Button
          onClick={onClose}
          variant="outline"
          className="w-full"
        >
          Annuler
        </Button>
      </CardContent>
    </Card>
  );
};
