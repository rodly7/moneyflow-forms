
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase, calculateFee } from "@/integrations/supabase/client";

export const useWithdrawalConfirmation = (onClose: () => void) => {
  const [verificationCode, setVerificationCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const confirmWithdrawal = async (code: string) => {
    if (!user?.id) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour confirmer un retrait",
        variant: "destructive"
      });
      return { success: false };
    }

    try {
      setIsProcessing(true);
      
      // Trouver le retrait avec ce code de vérification
      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('verification_code', code)
        .eq('status', 'pending')
        .single();

      if (withdrawalError || !withdrawalData) {
        throw new Error("Ce code de vérification n'existe pas ou a déjà été utilisé");
      }

      // S'assurer que l'agent n'est pas l'utilisateur qui a fait la demande
      if (withdrawalData.user_id === user.id) {
        throw new Error("Vous ne pouvez pas confirmer votre propre retrait");
      }

      // Calculer les frais avec la nouvelle fonction
      const { fee, agentCommission, moneyFlowCommission } = calculateFee(
        withdrawalData.amount,
        "Cameroun", // Pays par défaut
        "Cameroun", // Retrait national par défaut
        "agent"
      );

      // Mettre à jour le statut du retrait à 'completed'
      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({ 
          status: 'completed', 
          updated_at: new Date().toISOString()
        })
        .eq('id', withdrawalData.id);

      if (updateError) throw updateError;

      // Ajouter les fonds (montant moins les frais plus la commission de l'agent) au compte de l'agent
      const { error: balanceError } = await supabase
        .rpc('increment_balance', { 
          user_id: user.id, 
          amount: withdrawalData.amount - fee + agentCommission
        });

      if (balanceError) {
        throw new Error("Erreur lors du transfert des fonds");
      }

      toast({
        title: "Retrait confirmé",
        description: `Retrait de ${withdrawalData.amount} FCFA effectué avec succès. Commission: ${agentCommission} FCFA`,
      });

      onClose();
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la confirmation du retrait:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur s'est produite lors de la confirmation du retrait",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    verificationCode,
    setVerificationCode,
    isProcessing,
    confirmWithdrawal
  };
};
