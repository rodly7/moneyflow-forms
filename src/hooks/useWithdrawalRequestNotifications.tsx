
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  // Récupérer les demandes de retrait en attente
  const { data: pendingRequests = [], refetch } = useQuery({
    queryKey: ['withdrawal-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Erreur lors de la récupération des demandes:", error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Vérifier toutes les 30 secondes
  });

  useEffect(() => {
    // Afficher automatiquement la notification s'il y a des demandes en attente
    if (pendingRequests.length > 0 && !showNotification) {
      setSelectedRequest(pendingRequests[0]);
      setShowNotification(true);
    }
  }, [pendingRequests, showNotification]);

  const handleNotificationClick = () => {
    if (pendingRequests.length > 0) {
      setSelectedRequest(pendingRequests[0]);
      setShowNotification(true);
    }
  };

  const handleConfirm = async (requestId: string) => {
    try {
      // Mettre à jour le statut de la demande à "approved"
      const { error: updateError } = await supabase
        .from('withdrawal_requests')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) {
        throw new Error("Erreur lors de l'approbation");
      }

      setShowNotification(false);
      setSelectedRequest(null);
      refetch();
      
    } catch (error) {
      console.error("Erreur lors de la confirmation:", error);
      throw error;
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      // Mettre à jour le statut de la demande à "rejected"
      const { error: updateError } = await supabase
        .from('withdrawal_requests')
        .update({ 
          status: 'rejected',
          rejected_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) {
        throw new Error("Erreur lors du refus");
      }

      setShowNotification(false);
      setSelectedRequest(null);
      refetch();
      
    } catch (error) {
      console.error("Erreur lors du refus:", error);
      throw error;
    }
  };

  const closeNotification = () => {
    setShowNotification(false);
    setSelectedRequest(null);
  };

  return {
    pendingRequests,
    selectedRequest,
    showNotification,
    handleNotificationClick,
    handleConfirm,
    handleReject,
    closeNotification
  };
};
