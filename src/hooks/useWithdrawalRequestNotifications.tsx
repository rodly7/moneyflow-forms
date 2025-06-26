
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const useWithdrawalRequestNotifications = () => {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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
    refetchInterval: 30000, // Refresh toutes les 30 secondes
  });

  const handleNotificationClick = () => {
    console.log("Redirection vers la confirmation de retrait");
    navigate('/withdraw');
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
    pendingRequests,
    handleNotificationClick,
    markAsRead,
    refetch
  };
};
