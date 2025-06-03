
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchWithdrawalByCode, 
  findAvailableAgent, 
  updateWithdrawalStatus,
  updateWithdrawalStatusByCode,
  validateUserBalanceForWithdrawal
} from "@/services/withdrawalService";
import { 
  debitUserBalance, 
  creditUserBalance, 
  creditPlatformCommission 
} from "@/services/balanceService";
import { 
  calculateWithdrawalFees
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
      const withdrawalAmount = Number(withdrawalData.amount) || 0;

      console.log("Données du retrait trouvées:", {
        id: withdrawalData.id,
        montant: withdrawalAmount,
        utilisateur: user.id
      });

      // 2. Valider le solde de l'utilisateur depuis la base de données
      const balanceValidation = await validateUserBalanceForWithdrawal(user.id, withdrawalAmount);
      
      console.log("Validation du solde réussie:", balanceValidation);

      // 3. Calculer les commissions
      const { totalFee, agentCommission, platformCommission } = calculateWithdrawalFees(withdrawalAmount);

      // 4. Débiter le montant du compte utilisateur
      await debitUserBalance(user.id, withdrawalAmount);

      try {
        // 5. Trouver un agent pour traiter le retrait
        const agentId = await findAvailableAgent();
        const agentCredit = withdrawalAmount - totalFee + agentCommission;
        
        // 6. Créditer l'agent
        await creditUserBalance(agentId, agentCredit);
        
        // 7. Créditer la commission platform au compte admin
        await creditPlatformCommission(platformCommission);

        // 8. Mettre à jour le statut du retrait à completed
        await updateWithdrawalStatus(withdrawalData.id, 'completed');

        toast({
          title: "Retrait confirmé",
          description: `Votre retrait de ${withdrawalAmount} FCFA a été confirmé et effectué par l'agent. Nouveau solde: ${balanceValidation.remainingBalance} FCFA`,
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
