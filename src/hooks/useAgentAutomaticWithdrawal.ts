
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { validateUserBalance } from "@/services/withdrawalService";

export const useAgentAutomaticWithdrawal = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const processAgentAutomaticWithdrawal = async (
    clientId: string,
    amount: number,
    phoneNumber: string,
    clientName: string,
    clientBalance: number
  ) => {
    if (!user?.id) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour effectuer un retrait",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);

      // Vérifier le solde du client
      console.log("🔍 Vérification du solde du client...");
      await validateUserBalance(clientId, amount);

      // Créer la demande de retrait automatique pour le client
      const { data: withdrawal, error: withdrawalError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: clientId,
          amount: amount,
          withdrawal_phone: phoneNumber,
          status: 'completed' // Retrait automatique - traité immédiatement
        })
        .select()
        .single();

      if (withdrawalError) {
        console.error("❌ Erreur lors de la création du retrait:", withdrawalError);
        throw new Error("Erreur lors de la création de la demande de retrait");
      }

      // Débiter le compte du client
      const { error: debitError } = await supabase.rpc('increment_balance', {
        user_id: clientId,
        amount: -amount
      });

      if (debitError) {
        console.error("❌ Erreur lors du débit du client:", debitError);
        
        // Annuler la demande de retrait en cas d'erreur
        await supabase
          .from('withdrawals')
          .delete()
          .eq('id', withdrawal.id);
          
        throw new Error("Erreur lors du débit du compte client");
      }

      // Créditer l'agent avec le montant retiré
      const { error: creditError } = await supabase.rpc('increment_balance', {
        user_id: user.id,
        amount: amount
      });

      if (creditError) {
        console.error("❌ Erreur lors du crédit de l'agent:", creditError);
        
        // En cas d'erreur, remettre l'argent au client et annuler le retrait
        await supabase.rpc('increment_balance', {
          user_id: clientId,
          amount: amount
        });
        
        await supabase
          .from('withdrawals')
          .delete()
          .eq('id', withdrawal.id);
          
        throw new Error("Erreur lors du crédit de votre compte agent");
      }

      console.log("✅ Retrait automatique agent effectué avec succès");

      toast({
        title: "Retrait effectué",
        description: `Retrait de ${amount.toLocaleString()} FCFA effectué pour ${clientName}`,
      });

      return { 
        success: true, 
        newClientBalance: clientBalance - amount,
        clientName 
      };
    } catch (error) {
      console.error("❌ Erreur lors du retrait automatique agent:", error);
      toast({
        title: "Erreur de retrait",
        description: error instanceof Error ? error.message : "Erreur lors du retrait automatique",
        variant: "destructive"
      });
      return { success: false, error };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processAgentAutomaticWithdrawal,
    isProcessing
  };
};
