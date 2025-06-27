
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { calculateDepositFees, calculateWithdrawalFees } from "@/utils/depositWithdrawalCalculations";
import { getUserBalance } from "@/services/withdrawalService";
import { AuthErrorHandler } from "@/services/authErrorHandler";
import { errorHandlingService } from "@/services/errorHandlingService";

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

      // Transaction avec gestion d'erreurs améliorée
      const { error: debitError } = await supabase.rpc('increment_balance', {
        user_id: user.id,
        amount: -amount
      });

      if (debitError) {
        throw new Error("Erreur lors du débit du compte agent");
      }

      const { error: creditError } = await supabase.rpc('increment_balance', {
        user_id: recipientId,
        amount: amount
      });

      if (creditError) {
        // Rollback en cas d'erreur
        await supabase.rpc('increment_balance', {
          user_id: user.id,
          amount: amount
        });
        throw new Error("Erreur lors du crédit du compte client");
      }

      // Enregistrer la transaction
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
        title: "✅ Dépôt effectué avec succès",
        description: `Dépôt de ${amount.toLocaleString()} FCFA effectué pour ${recipientName}`,
      });

      AuthErrorHandler.clearRetries('deposit_operation');
      return true;
    } catch (error) {
      console.error('Erreur lors du dépôt:', error);
      const errorMessage = await errorHandlingService.handleAuthError(error);
      toast({
        title: "❌ Erreur",
        description: errorMessage,
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

      // Calculer les frais
      const { totalFee, agentCommission, platformCommission } = calculateWithdrawalFees(amount);
      const totalAmount = amount + totalFee;

      // Vérifier le solde du client
      const clientBalanceData = await getUserBalance(clientId);
      if (clientBalanceData.balance < totalAmount) {
        throw new Error(`Solde client insuffisant. Solde: ${clientBalanceData.balance.toLocaleString()} FCFA, montant total requis: ${totalAmount.toLocaleString()} FCFA`);
      }

      // Transaction avec rollback en cas d'erreur
      const { error: debitError } = await supabase.rpc('increment_balance', {
        user_id: clientId,
        amount: -totalAmount
      });

      if (debitError) {
        throw new Error("Erreur lors du débit du compte client");
      }

      const { error: creditError } = await supabase.rpc('increment_balance', {
        user_id: user.id,
        amount: amount + agentCommission
      });

      if (creditError) {
        // Rollback
        await supabase.rpc('increment_balance', {
          user_id: clientId,
          amount: totalAmount
        });
        throw new Error("Erreur lors du crédit du compte agent");
      }

      // Commission plateforme
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

      // Enregistrer le retrait
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
        title: "✅ Retrait effectué avec succès",
        description: `Retrait de ${amount.toLocaleString()} FCFA pour ${clientName}. Votre commission: ${agentCommission.toLocaleString()} FCFA`,
      });

      AuthErrorHandler.clearRetries('withdrawal_operation');
      return true;
    } catch (error) {
      console.error('Erreur lors du retrait:', error);
      const errorMessage = await errorHandlingService.handleAuthError(error);
      toast({
        title: "❌ Erreur",
        description: errorMessage,
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
