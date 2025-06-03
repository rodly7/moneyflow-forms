
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchWithdrawalByCode, 
  fetchUserBalance, 
  findAvailableAgent, 
  updateWithdrawalStatus,
  updateWithdrawalStatusByCode 
} from "@/services/withdrawalService";
import { 
  debitUserBalance, 
  creditUserBalance, 
  creditPlatformCommission 
} from "@/services/balanceService";
import { 
  calculateWithdrawalFees, 
  validateSufficientBalance 
} from "@/utils/withdrawalCalculations";

export const useWithdrawalOperations = (onClose: () => void) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async (verificationCode: string) => {
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
      
      // 1. Trouver le retrait avec le code de vérification
      const withdrawalData = await fetchWithdrawalByCode(verificationCode, user.id);

      // 2. Récupérer et vérifier le solde de l'utilisateur
      const currentBalance = await fetchUserBalance(user.id);
      const withdrawalAmount = Number(withdrawalData.amount) || 0;

      console.log("Vérification du solde:", {
        soldeActuel: currentBalance,
        montantDemande: withdrawalAmount,
        utilisateur: user.id
      });

      // 3. Vérifier si le solde est suffisant
      validateSufficientBalance(currentBalance, withdrawalAmount);

      // 4. Calculer les commissions
      const { totalFee, agentCommission, platformCommission } = calculateWithdrawalFees(withdrawalAmount);

      // 5. Débiter le montant du compte utilisateur
      await debitUserBalance(user.id, withdrawalAmount);

      try {
        // 6. Trouver un agent pour traiter le retrait
        const agentId = await findAvailableAgent();
        const agentCredit = withdrawalAmount - totalFee + agentCommission;
        
        // 7. Créditer l'agent
        await creditUserBalance(agentId, agentCredit);
        
        // 8. Créditer la commission platform au compte admin
        await creditPlatformCommission(platformCommission);

        // 9. Mettre à jour le statut du retrait à completed
        await updateWithdrawalStatus(withdrawalData.id, 'completed');

        toast({
          title: "Retrait confirmé",
          description: `Votre retrait de ${withdrawalAmount} FCFA a été confirmé et effectué par l'agent.`,
        });

        onClose();
      } catch (error) {
        // En cas d'erreur, annuler le débit utilisateur
        await creditUserBalance(user.id, withdrawalAmount);
        throw error;
      }
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

  const handleReject = async (verificationCode: string) => {
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
      
      await updateWithdrawalStatusByCode(verificationCode, user?.id || '', 'rejected');

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

  return {
    handleConfirm,
    handleReject,
    isProcessing
  };
};
