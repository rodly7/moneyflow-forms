
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { processApprovedWithdrawal } from "@/services/agentWithdrawalRequestService";

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
      if (!user?.id) {
        console.log("Pas d'utilisateur connecté");
        return [];
      }
      
      console.log("🔍 Recherche des demandes de retrait pour l'utilisateur:", user.id);
      
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("❌ Erreur lors de la récupération des demandes:", error);
        return [];
      }
      
      console.log("✅ Demandes trouvées:", data?.length || 0, data);
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 2000, // Vérifier toutes les 2 secondes pour des tests plus rapides
  });

  useEffect(() => {
    console.log("🔄 Hook effect - pendingRequests changed:", pendingRequests?.length || 0);
    
    // Afficher automatiquement la notification s'il y a des demandes en attente et qu'aucune notification n'est déjà affichée
    if (pendingRequests && pendingRequests.length > 0 && !showNotification && !selectedRequest) {
      console.log("🔔 Affichage automatique de la notification de retrait:", pendingRequests[0]);
      setSelectedRequest(pendingRequests[0]);
      setShowNotification(true);
    }
  }, [pendingRequests, showNotification, selectedRequest]);

  const handleNotificationClick = () => {
    console.log("🔔 handleNotificationClick appelé, pendingRequests:", pendingRequests?.length || 0);
    
    if (pendingRequests && pendingRequests.length > 0) {
      console.log("📱 Affichage de la demande:", pendingRequests[0]);
      setSelectedRequest(pendingRequests[0]);
      setShowNotification(true);
    } else {
      console.log("⚠️ Aucune demande en attente à afficher");
      toast({
        title: "Aucune demande",
        description: "Aucune demande de retrait en attente",
      });
    }
  };

  const handleConfirm = async (requestId: string) => {
    try {
      console.log("✅ Confirmation de la demande:", requestId);
      
      // Mettre à jour le statut de la demande à "approved"
      const { error: updateError } = await supabase
        .from('withdrawal_requests')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) {
        console.error("❌ Erreur lors de l'approbation:", updateError);
        throw new Error("Erreur lors de l'approbation");
      }

      console.log("✅ Demande approuvée, traitement du retrait...");
      
      // Traiter automatiquement le retrait approuvé
      const result = await processApprovedWithdrawal(requestId);
      
      console.log("💰 Retrait traité avec succès:", result);
      setShowNotification(false);
      setSelectedRequest(null);
      refetch();
      
      toast({
        title: "Retrait autorisé et effectué",
        description: `Le retrait de ${result.amount} FCFA a été effectué avec succès`,
      });
      
    } catch (error) {
      console.error("❌ Erreur lors de la confirmation:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la confirmation du retrait",
        variant: "destructive"
      });
      throw error;
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      console.log("❌ Refus de la demande:", requestId);
      
      // Mettre à jour le statut de la demande à "rejected"
      const { error: updateError } = await supabase
        .from('withdrawal_requests')
        .update({ 
          status: 'rejected',
          rejected_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) {
        console.error("❌ Erreur lors du refus:", updateError);
        throw new Error("Erreur lors du refus");
      }

      console.log("❌ Demande refusée avec succès");
      setShowNotification(false);
      setSelectedRequest(null);
      refetch();
      
      toast({
        title: "Retrait refusé",
        description: "Vous avez refusé cette demande de retrait",
      });
      
    } catch (error) {
      console.error("❌ Erreur lors du refus:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors du refus du retrait",
        variant: "destructive"
      });
      throw error;
    }
  };

  const closeNotification = () => {
    console.log("🔒 Fermeture de la notification");
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
