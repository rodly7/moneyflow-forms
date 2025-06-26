
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { calculateWithdrawalFees } from "@/utils/depositWithdrawalCalculations";

interface WithdrawalRequest {
  id: string;
  amount: number;
  agent_name: string;
  agent_phone: string;
  created_at: string;
  user_id: string;
  agent_id: string;
  status: string;
  withdrawal_phone: string;
}

export const useWithdrawalRequestNotifications = () => {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  // Récupérer les demandes de retrait en attente
  const { data: pendingRequests, refetch } = useQuery({
    queryKey: ['withdrawalRequests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (error) {
        console.error("Erreur lors de la récupération des demandes:", error);
        return [];
      }

      return data || [];
    },
    enabled: !!user?.id && userRole !== 'agent',
    refetchInterval: 15000,
  });

  const handleNotificationClick = () => {
    if (pendingRequests && pendingRequests.length > 0) {
      setSelectedRequest(pendingRequests[0]);
      setShowNotification(true);
      
      toast({
        title: "💰 Demande de retrait",
        description: `Un agent souhaite retirer ${pendingRequests[0].amount} FCFA de votre compte`,
      });
    } else {
      navigate('/withdraw');
    }
  };

  const handleConfirm = async (requestId: string) => {
    if (!selectedRequest) return;
    
    try {
      const { totalFee, agentCommission, platformCommission } = calculateWithdrawalFees(selectedRequest.amount);
      const totalAmount = selectedRequest.amount + totalFee;

      // Vérifier le solde de l'utilisateur en utilisant increment_balance avec amount 0
      const { data: userBalance, error: balanceError } = await supabase
        .rpc('increment_balance', { 
          user_id: user?.id, 
          amount: 0 
        });

      if (balanceError || userBalance === null || Number(userBalance) < totalAmount) {
        toast({
          title: "❌ Solde insuffisant",
          description: `Vous n'avez pas assez de fonds pour ce retrait (${totalAmount} FCFA requis incluant les frais)`,
          variant: "destructive"
        });
        return;
      }

      // Débiter l'utilisateur (montant + frais)
      const { error: debitError } = await supabase.rpc('increment_balance', {
        user_id: user?.id,
        amount: -totalAmount
      });

      if (debitError) {
        console.error("Erreur lors du débit:", debitError);
        toast({
          title: "❌ Erreur",
          description: "Erreur lors du débit de votre compte",
          variant: "destructive"
        });
        return;
      }

      // Créditer l'agent (montant + commission)
      const { error: creditError } = await supabase.rpc('increment_balance', {
        user_id: selectedRequest.agent_id,
        amount: selectedRequest.amount + agentCommission
      });

      if (creditError) {
        console.error("Erreur lors du crédit agent:", creditError);
        // Annuler le débit de l'utilisateur
        await supabase.rpc('increment_balance', {
          user_id: user?.id,
          amount: totalAmount
        });
        toast({
          title: "❌ Erreur",
          description: "Erreur lors du crédit de l'agent",
          variant: "destructive"
        });
        return;
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
          user_id: user?.id,
          amount: selectedRequest.amount,
          withdrawal_phone: selectedRequest.withdrawal_phone,
          status: 'completed'
        });

      if (withdrawalError) {
        console.error("❌ Erreur lors de l'enregistrement du retrait:", withdrawalError);
      }

      // Mettre à jour le statut de la demande
      const { error: updateError } = await supabase
        .from('withdrawal_requests')
        .update({ status: 'confirmed' })
        .eq('id', requestId);
      
      if (updateError) {
        console.error("Erreur lors de la mise à jour:", updateError);
      }
      
      toast({
        title: "✅ Retrait autorisé",
        description: `Vous avez autorisé le retrait de ${selectedRequest.amount} FCFA par ${selectedRequest.agent_name}. Frais: ${totalFee} FCFA`,
      });
      
      setShowNotification(false);
      setSelectedRequest(null);
      queryClient.invalidateQueries({ queryKey: ['withdrawalRequests'] });
      refetch();
    } catch (error) {
      console.error("Erreur lors de la confirmation:", error);
      toast({
        title: "❌ Erreur",
        description: "Impossible d'autoriser le retrait. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (requestId: string) => {
    if (!selectedRequest) return;
    
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);
      
      if (error) throw error;
      
      toast({
        title: "🚫 Retrait refusé",
        description: `Vous avez refusé la demande de retrait de ${selectedRequest.agent_name}`,
      });
      
      setShowNotification(false);
      setSelectedRequest(null);
      queryClient.invalidateQueries({ queryKey: ['withdrawalRequests'] });
      refetch();
    } catch (error) {
      console.error("Erreur lors du refus:", error);
      toast({
        title: "❌ Erreur",
        description: "Impossible de refuser le retrait. Veuillez réessayer.",
        variant: "destructive"
      });
    }
  };

  const closeNotification = () => {
    setShowNotification(false);
    setSelectedRequest(null);
  };

  const markAsRead = async (requestId: string) => {
    try {
      await supabase
        .from('withdrawal_requests')
        .update({ status: 'confirmed' })
        .eq('id', requestId);
      
      queryClient.invalidateQueries({ queryKey: ['withdrawalRequests'] });
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    }
  };

  return {
    pendingRequests: pendingRequests || [],
    selectedRequest,
    showNotification,
    handleNotificationClick,
    handleConfirm,
    handleReject,
    closeNotification,
    markAsRead,
    refetch
  };
};
