
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { createWithdrawalRequest } from "@/services/agentWithdrawalRequestService";
import { getUserBalance } from "@/services/withdrawalService";

export const useAgentWithdrawalRequest = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const requestWithdrawal = async (
    clientId: string,
    clientName: string,
    amount: number,
    phoneNumber: string
  ) => {
    if (!user?.id) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour effectuer un retrait",
        variant: "destructive"
      });
      return { success: false };
    }

    try {
      setIsProcessing(true);

      // Vérifier le solde du client
      const clientBalanceData = await getUserBalance(clientId);
      
      if (clientBalanceData.balance < amount) {
        throw new Error(`Solde insuffisant. Le client a ${clientBalanceData.balance} FCFA, montant demandé: ${amount} FCFA`);
      }

      // Récupérer les informations de l'agent
      const agentData = await getUserBalance(user.id);

      // Créer la demande de retrait
      const request = await createWithdrawalRequest({
        user_id: clientId,
        agent_id: user.id,
        agent_name: agentData.fullName || "Agent",
        agent_phone: agentData.phone || phoneNumber,
        amount: amount,
        withdrawal_phone: phoneNumber
      });

      toast({
        title: "Demande envoyée",
        description: `Demande de retrait de ${amount.toLocaleString()} FCFA envoyée à ${clientName}. En attente d'autorisation.`,
      });

      return { 
        success: true, 
        requestId: request.id,
        clientName 
      };
    } catch (error) {
      console.error("❌ Erreur lors de la demande de retrait:", error);
      toast({
        title: "Erreur de demande",
        description: error instanceof Error ? error.message : "Erreur lors de la demande de retrait",
        variant: "destructive"
      });
      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    requestWithdrawal,
    isProcessing
  };
};
