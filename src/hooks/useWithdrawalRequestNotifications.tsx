
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WithdrawalRequest {
  id: string;
  amount: number;
  user_id: string;
  agent_id: string;
  status: string;
  created_at: string;
  user_name?: string;
  user_phone?: string;
}

export const useWithdrawalRequestNotifications = () => {
  const { user, profile, isAgent } = useAuth();
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [showSecureConfirmation, setShowSecureConfirmation] = useState(false);

  console.log('🔔 useWithdrawalRequestNotifications - État:', { 
    user: !!user, 
    profile: !!profile, 
    isAgent: isAgent(),
    requestsCount: withdrawalRequests.length 
  });

  // Récupérer les demandes de retrait pour les agents
  useEffect(() => {
    if (!user || !profile || !isAgent()) {
      console.log('❌ Pas d\'agent connecté, pas de notifications de retrait');
      return;
    }

    console.log('🔍 Agent connecté, récupération des demandes de retrait...');
    
    const fetchWithdrawalRequests = async () => {
      try {
        const { data, error } = await supabase
          .from('withdrawal_requests')
          .select(`
            *,
            profiles!withdrawal_requests_user_id_fkey(full_name, phone)
          `)
          .eq('agent_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Erreur récupération demandes de retrait:', error);
          return;
        }

        const formattedRequests = data?.map(request => ({
          ...request,
          user_name: request.profiles?.full_name || 'Utilisateur inconnu',
          user_phone: request.profiles?.phone || 'Téléphone inconnu'
        })) || [];

        console.log('✅ Demandes de retrait récupérées:', formattedRequests.length);
        setWithdrawalRequests(formattedRequests);
      } catch (error) {
        console.error('❌ Erreur lors de la récupération des demandes:', error);
      }
    };

    fetchWithdrawalRequests();

    // Écouter les nouvelles demandes de retrait en temps réel
    const channel = supabase
      .channel('withdrawal_requests')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'withdrawal_requests',
          filter: `agent_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('🔔 Nouvelle demande de retrait reçue:', payload);
          fetchWithdrawalRequests();
          
          toast.success('Nouvelle demande de retrait reçue!', {
            description: 'Vérifiez vos notifications pour traiter la demande.'
          });
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Déconnexion du canal de notifications');
      supabase.removeChannel(channel);
    };
  }, [user, profile, isAgent]);

  const handleNotificationClick = (request: WithdrawalRequest) => {
    console.log('🔔 Clic sur notification de retrait:', request.id);
    setSelectedRequest(request);
    setShowSecureConfirmation(true);
  };

  const handleSecureConfirm = async () => {
    if (!selectedRequest) return;

    try {
      console.log('✅ Confirmation sécurisée du retrait:', selectedRequest.id);

      const { error } = await supabase
        .from('withdrawal_requests')
        .update({ 
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast.success('Demande de retrait confirmée avec succès!');
      
      // Retirer la demande de la liste
      setWithdrawalRequests(prev => 
        prev.filter(req => req.id !== selectedRequest.id)
      );
      
      setShowSecureConfirmation(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('❌ Erreur confirmation retrait:', error);
      toast.error('Erreur lors de la confirmation du retrait');
    }
  };

  const handleSecureReject = async () => {
    if (!selectedRequest) return;

    try {
      console.log('❌ Rejet sécurisé du retrait:', selectedRequest.id);

      const { error } = await supabase
        .from('withdrawal_requests')
        .update({ 
          status: 'rejected',
          rejected_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast.success('Demande de retrait rejetée');
      
      // Retirer la demande de la liste
      setWithdrawalRequests(prev => 
        prev.filter(req => req.id !== selectedRequest.id)
      );
      
      setShowSecureConfirmation(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('❌ Erreur rejet retrait:', error);
      toast.error('Erreur lors du rejet du retrait');
    }
  };

  const closeSecureConfirmation = () => {
    console.log('🔒 Fermeture de la confirmation sécurisée');
    setShowSecureConfirmation(false);
    setSelectedRequest(null);
  };

  return {
    withdrawalRequests,
    selectedRequest,
    showSecureConfirmation,
    handleNotificationClick,
    handleSecureConfirm,
    handleSecureReject,
    closeSecureConfirmation
  };
};
