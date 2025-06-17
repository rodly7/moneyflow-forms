
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
    refetchInterval: 5000, // Vérifier toutes les 5 secondes pour plus de réactivité
  });

  useEffect(() => {
    // Afficher automatiquement la notification s'il y a des demandes en attente et qu'aucune notification n'est déjà affichée
    if (pendingRequests.length > 0 && !showNotification && !selectedRequest) {
      console.log("Affichage automatique de la notification de retrait:", pendingRequests[0]);
      setSelectedRequest(pendingRequests[0]);
      setShowNotification(true);
    }
  }, [pendingRequests, showNotification, selectedRequest]);

  const handleNotificationClick = () => {
    if (pendingRequests.length > 0) {
      console.log("Clic sur la notification, affichage de la demande:", pendingRequests[0]);
      setSelectedRequest(pendingRequests[0]);
      setShowNotification(true);
    }
  };

  const handleConfirm = async (requestId: string) => {
    try {
      console.log("Confirmation de la demande:", requestId);
      
      // Mettre à jour le statut de la demande à "approved"
      const { error: updateError } = await supabase
        .from('withdrawal_requests')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) {
        console.error("Erreur lors de l'approbation:", updateError);
        throw new Error("Erreur lors de l'approbation");
      }

      console.log("Demande approuvée avec succès");
      setShowNotification(false);
      setSelectedRequest(null);
      refetch();
      
      toast({
        title: "Retrait autorisé",
        description: "Vous avez autorisé cette demande de retrait",
      });
      
    } catch (error) {
      console.error("Erreur lors de la confirmation:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la confirmation du retrait",
        variant: "destructive"
      });
      throw error;
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      console.log("Refus de la demande:", requestId);
      
      // Mettre à jour le statut de la demande à "rejected"
      const { error: updateError } = await supabase
        .from('withdrawal_requests')
        .update({ 
          status: 'rejected',
          rejected_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) {
        console.error("Erreur lors du refus:", updateError);
        throw new Error("Erreur lors du refus");
      }

      console.log("Demande refusée avec succès");
      setShowNotification(false);
      setSelectedRequest(null);
      refetch();
      
      toast({
        title: "Retrait refusé",
        description: "Vous avez refusé cette demande de retrait",
      });
      
    } catch (error) {
      console.error("Erreur lors du refus:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors du refus du retrait",
        variant: "destructive"
      });
      throw error;
    }
  };

  const closeNotification = () => {
    console.log("Fermeture de la notification");
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
