
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { calculateDepositFees, calculateWithdrawalFees } from "@/utils/depositWithdrawalCalculations";
import { getUserBalance } from "@/services/withdrawalService";

export const useDepositWithdrawalOperations = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const processDeposit = async (
    amount: number,
    recipientId: string,
    recipientName: string,
    recipientPhone: string
  ) => {
    if (!user?.id) {
      throw new Error("Agent non connecté");
    }

    setIsProcessing(true);

    try {
      // Vérifier le pays du destinataire
      const { data: recipientData, error: recipientError } = await supabase
        .from('profiles')
        .select('country')
        .eq('id', recipientId)
        .single();

      if (recipientError || !recipientData) {
        throw new Error("Impossible de vérifier les informations du destinataire");
      }

      // Vérifier que l'agent et le client sont dans le même pays
      if (profile?.country && recipientData.country !== profile.country) {
        throw new Error(`Vous ne pouvez effectuer des dépôts que pour des clients de ${profile.country}`);
      }

      // Calculer les frais (0 pour les dépôts)
      const { agentCommission } = calculateDepositFees(amount);

      // Vérifier le solde de l'agent
      const agentBalanceData = await getUserBalance(user.id);
      if (agentBalanceData.balance < amount) {
        throw new Error("Solde agent insuffisant pour effectuer ce dépôt");
      }

      // Débiter l'agent
      const { error: debitError } = await supabase.rpc('increment_balance', {
        user_id: user.id,
        amount: -amount
      });

      if (debitError) {
        throw new Error("Erreur lors du débit du compte agent");
      }

      // Créditer le client
      const { error: creditError } = await supabase.rpc('increment_balance', {
        user_id: recipientId,
        amount: amount
      });

      if (creditError) {
        // Annuler le débit de l'agent en cas d'erreur
        await supabase.rpc('increment_balance', {
          user_id: user.id,
          amount: amount
        });
        throw new Error("Erreur lors du crédit du compte client");
      }

      // Créditer la commission à l'agent (0 pour les dépôts)
      if (agentCommission > 0) {
        await supabase.rpc('increment_balance', {
          user_id: user.id,
          amount: agentCommission
        });
      }

      // Créer l'enregistrement de la transaction
      const transactionReference = `DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const { error: transactionError } = await supabase
        .from('recharges')
        .insert({
          user_id: recipientId,
          amount: amount,
          country: profile?.country || "Congo Brazzaville",
          payment_method: 'agent_deposit',
          payment_phone: recipientPhone,
          payment_provider: 'agent',
          transaction_reference: transactionReference,
          status: 'completed',
          provider_transaction_id: user.id
        });

      if (transactionError) {
        console.error('Erreur transaction:', transactionError);
      }

      toast({
        title: "Dépôt effectué avec succès",
        description: `Dépôt de ${amount} FCFA effectué pour ${recipientName}. Aucun frais appliqué.`,
      });

      return true;
    } catch (error) {
      console.error('Erreur lors du dépôt:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors du dépôt",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const processWithdrawal = async (
    amount: number,
    clientId: string,
    clientName: string,
    clientPhone: string
  ) => {
    if (!user?.id) {
      throw new Error("Agent non connecté");
    }

    setIsProcessing(true);

    try {
      // Vérifier le pays du client
      const { data: clientData, error: clientError } = await supabase
        .from('profiles')
        .select('country')
        .eq('id', clientId)
        .single();

      if (clientError || !clientData) {
        throw new Error("Impossible de vérifier les informations du client");
      }

      // Vérifier que l'agent et le client sont dans le même pays
      if (profile?.country && clientData.country !== profile.country) {
        throw new Error(`Vous ne pouvez effectuer des retraits que pour des clients de ${profile.country}`);
      }

      // Calculer les frais (1,5% pour les retraits)
      const { totalFee, agentCommission, platformCommission } = calculateWithdrawalFees(amount);
      const totalAmount = amount + totalFee;

      // Vérifier le solde du client
      const clientBalanceData = await getUserBalance(clientId);
      if (clientBalanceData.balance < totalAmount) {
        throw new Error(`Solde client insuffisant. Solde: ${clientBalanceData.balance} FCFA, montant total requis: ${totalAmount} FCFA (incluant frais de ${totalFee} FCFA)`);
      }

      // Débiter le client (montant + frais)
      const { error: debitError } = await supabase.rpc('increment_balance', {
        user_id: clientId,
        amount: -totalAmount
      });

      if (debitError) {
        throw new Error("Erreur lors du débit du compte client");
      }

      // Créditer l'agent (montant + commission)
      const { error: creditError } = await supabase.rpc('increment_balance', {
        user_id: user.id,
        amount: amount + agentCommission
      });

      if (creditError) {
        // Annuler le débit du client en cas d'erreur
        await supabase.rpc('increment_balance', {
          user_id: clientId,
          amount: totalAmount
        });
        throw new Error("Erreur lors du crédit du compte agent");
      }

      // Créditer la commission plateforme
      if (platformCommission > 0) {
        const { data: adminData } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone', '+221773637752')
          .maybeSingle();
          
        if (adminData) {
          await supabase.rpc('increment_balance', {
            user_id: adminData.id,
            amount: platformCommission
          });
        }
      }

      // Créer l'enregistrement du retrait
      const { error: withdrawalError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: clientId,
          amount: amount,
          withdrawal_phone: clientPhone,
          status: 'completed'
        });

      if (withdrawalError) {
        console.error("❌ Erreur lors de l'enregistrement du retrait:", withdrawalError);
      }

      toast({
        title: "Retrait effectué avec succès",
        description: `Retrait de ${amount} FCFA effectué pour ${clientName}. Frais: ${totalFee} FCFA (1,5%). Votre commission: ${agentCommission} FCFA.`,
      });

      return true;
    } catch (error) {
      console.error('Erreur lors du retrait:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors du retrait",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processDeposit,
    processWithdrawal,
    isProcessing
  };
};
