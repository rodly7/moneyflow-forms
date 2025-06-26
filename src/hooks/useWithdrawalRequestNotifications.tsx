
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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
    refetchInterval: 15000, // Refresh toutes les 15 secondes pour plus de réactivité
  });

  const handleNotificationClick = () => {
    if (pendingRequests && pendingRequests.length > 0) {
      setSelectedRequest(pendingRequests[0]);
      setShowNotification(true);
      
      // Afficher un toast informatif
      toast({
        title: "💰 Demande de retrait",
        description: `Un agent souhaite retirer ${pendingRequests[0].amount} FCFA de votre compte`,
      });
    } else {
      // Si pas de demandes en attente, rediriger vers la page de retrait
      navigate('/withdraw');
    }
  };

  const handleConfirm = async (requestId: string) => {
    if (!selectedRequest) return;
    
    try {
      // Mettre à jour le statut de la demande
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({ status: 'confirmed' })
        .eq('id', requestId);
      
      if (error) throw error;
      
      toast({
        title: "✅ Retrait autorisé",
        description: `Vous avez autorisé le retrait de ${selectedRequest.amount} FCFA par ${selectedRequest.agent_name}`,
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
      
      // Rafraîchir les données
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
