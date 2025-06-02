
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase, calculateFee } from "@/integrations/supabase/client";
import { CheckCircle, XCircle } from "lucide-react";

interface WithdrawalConfirmationProps {
  onClose: () => void;
}

const WithdrawalConfirmation = ({ onClose }: WithdrawalConfirmationProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [verificationCode, setVerificationCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Code invalide",
        description: "Veuillez entrer un code de vérification à 6 chiffres",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour confirmer un retrait",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      // Trouver le retrait avec ce code de vérification pour cet utilisateur
      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('verification_code', verificationCode)
        .eq('user_id', user.id)
        .eq('status', 'agent_pending')
        .maybeSingle();

      if (withdrawalError) {
        console.error("Erreur lors de la recherche du retrait:", withdrawalError);
        throw new Error("Erreur de base de données lors de la vérification du code");
      }

      if (!withdrawalData) {
        throw new Error("Ce code de vérification n'existe pas ou a déjà été utilisé");
      }

      // Vérifier le solde de l'utilisateur
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Erreur lors de la vérification du profil:", profileError);
        throw new Error("Impossible de vérifier votre solde");
      }

      if (!userProfile) {
        throw new Error("Profil utilisateur introuvable");
      }

      if (userProfile.balance < withdrawalData.amount) {
        throw new Error("Solde insuffisant pour effectuer ce retrait");
      }

      // Calculer les frais en utilisant la fonction calculateFee
      const { fee, agentCommission, moneyFlowCommission } = calculateFee(withdrawalData.amount);

      // 1. Débiter le montant du compte utilisateur
      const { error: deductError } = await supabase.rpc('increment_balance', {
        user_id: user.id,
        amount: -(withdrawalData.amount)
      });

      if (deductError) {
        console.error("Erreur lors du débit:", deductError);
        throw new Error("Erreur lors du débit de votre compte");
      }

      // 2. Trouver l'agent qui a fait la demande et créditer son compte
      // Pour l'instant, on utilise le premier agent trouvé, mais idéalement il faudrait
      // stocker l'ID de l'agent qui a fait la demande dans la table withdrawals
      const { data: agentProfiles, error: agentError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'agent')
        .limit(1);

      if (agentError || !agentProfiles || agentProfiles.length === 0) {
        // Annuler le débit utilisateur
        await supabase.rpc('increment_balance', {
          user_id: user.id,
          amount: withdrawalData.amount
        });
        throw new Error("Aucun agent trouvé pour traiter le retrait");
      }

      const agentId = agentProfiles[0].id;
      // L'agent reçoit le montant moins les frais plus sa commission
      const netAmountForAgent = withdrawalData.amount - fee + agentCommission;
      
      const { error: creditError } = await supabase.rpc('increment_balance', {
        user_id: agentId,
        amount: netAmountForAgent
      });

      if (creditError) {
        console.error("Erreur lors du crédit agent:", creditError);
        // Annuler le débit utilisateur si le crédit agent échoue
        await supabase.rpc('increment_balance', {
          user_id: user.id,
          amount: withdrawalData.amount
        });
        throw new Error("Erreur lors du crédit du compte agent");
      }
      
      // 3. Créditer la commission platform au compte admin
      const { data: adminData, error: adminError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', '+221773637752')
        .maybeSingle();
        
      if (!adminError && adminData) {
        await supabase.rpc('increment_balance', {
          user_id: adminData.id,
          amount: moneyFlowCommission
        });
      }

      // 4. Mettre à jour le statut du retrait à completed
      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', withdrawalData.id);

      if (updateError) {
        console.error("Erreur lors de la mise à jour:", updateError);
        throw new Error("Erreur lors de la finalisation du retrait");
      }

      toast({
        title: "Retrait confirmé",
        description: `Votre retrait de ${withdrawalData.amount} FCFA a été confirmé et effectué par l'agent.`,
      });

      onClose();
    } catch (error) {
      console.error("Erreur lors de la confirmation du retrait:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur s'est produite lors de la confirmation du retrait",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Code invalide",
        description: "Veuillez entrer un code de vérification à 6 chiffres",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      // Mettre à jour le statut du retrait à rejected
      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('verification_code', verificationCode)
        .eq('user_id', user?.id)
        .eq('status', 'agent_pending');

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Retrait refusé",
        description: "Vous avez refusé cette demande de retrait.",
      });

      onClose();
    } catch (error) {
      console.error("Erreur lors du refus du retrait:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors du refus du retrait",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Confirmer le retrait</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="verificationCode">Code de vérification</Label>
          <Input
            id="verificationCode"
            type="text"
            placeholder="Entrez le code à 6 chiffres"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            maxLength={6}
            className="text-center text-lg"
          />
        </div>
        
        <div className="text-sm text-gray-600">
          <p>Un agent souhaite effectuer un retrait sur votre compte.</p>
          <p>Entrez le code de vérification pour confirmer ou refuser cette demande.</p>
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={handleConfirm}
            disabled={isProcessing || verificationCode.length !== 6}
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
            onClick={handleReject}
            disabled={isProcessing || verificationCode.length !== 6}
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

export default WithdrawalConfirmation;
