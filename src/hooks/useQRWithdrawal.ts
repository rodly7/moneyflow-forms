
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { calculateWithdrawalFees } from '@/utils/depositWithdrawalCalculations';

interface ScannedUserData {
  userId: string;
  fullName: string;
  phone: string;
}

export const useQRWithdrawal = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const processQRWithdrawal = async (
    scannedData: ScannedUserData,
    amount: number
  ) => {
    if (!user?.id || !profile) {
      throw new Error('Agent non connecté');
    }

    setIsProcessing(true);

    try {
      // Vérifier que le client scanné existe
      const { data: clientData, error: clientError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, balance, country')
        .eq('id', scannedData.userId)
        .single();

      if (clientError || !clientData) {
        throw new Error('Client non trouvé dans la base de données');
      }

      // Vérifier que les données correspondent
      if (clientData.full_name !== scannedData.fullName || 
          clientData.phone !== scannedData.phone) {
        throw new Error('Les données du QR code ne correspondent pas au client');
      }

      // Vérifier que l'agent et le client sont dans le même pays
      if (profile.country && clientData.country !== profile.country) {
        throw new Error(`Vous ne pouvez effectuer des retraits que pour des clients de ${profile.country}`);
      }

      // Calculer les frais
      const { totalFee, agentCommission, platformCommission } = calculateWithdrawalFees(amount);
      const totalAmount = amount + totalFee;

      // Vérifier le solde du client
      if (clientData.balance < totalAmount) {
        throw new Error(`Solde client insuffisant. Solde: ${clientData.balance} FCFA, montant total requis: ${totalAmount} FCFA`);
      }

      // Débiter le client
      const { error: debitError } = await supabase.rpc('increment_balance', {
        user_id: clientData.id,
        amount: -totalAmount
      });

      if (debitError) {
        throw new Error('Erreur lors du débit du compte client');
      }

      // Créditer l'agent
      const { error: creditError } = await supabase.rpc('increment_balance', {
        user_id: user.id,
        amount: amount + agentCommission
      });

      if (creditError) {
        // Annuler le débit du client
        await supabase.rpc('increment_balance', {
          user_id: clientData.id,
          amount: totalAmount
        });
        throw new Error('Erreur lors du crédit du compte agent');
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
          user_id: clientData.id,
          amount: amount,
          withdrawal_phone: clientData.phone,
          status: 'completed'
        });

      if (withdrawalError) {
        console.error('Erreur enregistrement retrait:', withdrawalError);
      }

      toast({
        title: 'Retrait QR confirmé avec succès',
        description: `Retrait de ${amount} FCFA effectué pour ${clientData.full_name}. Frais: ${totalFee} FCFA. Votre commission: ${agentCommission} FCFA.`,
      });

      return {
        success: true,
        clientName: clientData.full_name,
        newClientBalance: clientData.balance - totalAmount
      };

    } catch (error) {
      console.error('Erreur retrait QR:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors du retrait QR',
        variant: 'destructive'
      });
      return { success: false };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processQRWithdrawal,
    isProcessing
  };
};
