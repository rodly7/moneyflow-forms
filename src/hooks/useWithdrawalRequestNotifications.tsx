
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  agent_id: string;
  agent_name: string;
  agent_phone: string;
  amount: number;
  withdrawal_phone: string;
  status: string;
  created_at: string;
  approved_at?: string;
  rejected_at?: string;
  completed_at?: string;
}

export const useWithdrawalRequestNotifications = () => {
  const { user, profile, isAgent } = useAuth();
  const { toast } = useToast();
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [showSecureConfirmation, setShowSecureConfirmation] = useState(false);

  console.log('🔔 useWithdrawalRequestNotifications - État:', {
    user: !!user,
    profile: !!profile,
    isAgent: isAgent(),
    requestsCount: withdrawalRequests.length
  });

  useEffect(() => {
    if (!user || !isAgent()) {
      console.log('❌ Pas d\'agent connecté, pas de notifications de retrait');
      return;
    }

    const fetchWithdrawalRequests = async () => {
      try {
        console.log('🔄 Récupération des demandes de retrait pour agent:', user.id);
        
        const { data: requests, error } = await supabase
          .from('withdrawal_requests')
          .select('*')
          .eq('agent_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Erreur lors de la récupération des demandes:', error);
          return;
        }

        console.log('✅ Demandes de retrait trouvées:', requests?.length || 0);
        setWithdrawalRequests(requests || []);
      } catch (error) {
        console.error('❌ Erreur critique lors de la récupération des demandes:', error);
      }
    };

    fetchWithdrawalRequests();

    // Écouter les nouvelles demandes en temps réel
    const subscription = supabase
      .channel('withdrawal_requests')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'withdrawal_requests',
          filter: `agent_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('🔔 Nouvelle demande de retrait reçue:', payload.new);
          const newRequest = payload.new as WithdrawalRequest;
          setWithdrawalRequests(prev => [newRequest, ...prev]);
          
          toast({
            title: "Nouvelle demande de retrait",
            description: `Demande de ${newRequest.amount} XAF reçue`,
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, isAgent, toast]);

  const handleNotificationClick = (request: WithdrawalRequest) => {
    console.log('🔔 Clic sur notification de retrait:', request.id);
    setSelectedRequest(request);
    setShowSecureConfirmation(true);
  };

  const handleSecureConfirm = async () => {
    if (!selectedRequest) return;
    
    try {
      console.log('✅ Confirmation sécurisée de la demande:', selectedRequest.id);
      
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      // Retirer la demande de la liste
      setWithdrawalRequests(prev => 
        prev.filter(req => req.id !== selectedRequest.id)
      );

      toast({
        title: "Demande approuvée",
        description: "La demande de retrait a été approuvée avec succès",
      });

      setShowSecureConfirmation(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('❌ Erreur lors de l\'approbation:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'approuver la demande",
        variant: "destructive"
      });
    }
  };

  const handleSecureReject = async () => {
    if (!selectedRequest) return;
    
    try {
      console.log('❌ Rejet sécurisé de la demande:', selectedRequest.id);
      
      const { error } = await supabase
        .from('withdrawal_requests')
        .update({ 
          status: 'rejected',
          rejected_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      // Retirer la demande de la liste
      setWithdrawalRequests(prev => 
        prev.filter(req => req.id !== selectedRequest.id)
      );

      toast({
        title: "Demande rejetée",
        description: "La demande de retrait a été rejetée",
      });

      setShowSecureConfirmation(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('❌ Erreur lors du rejet:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rejeter la demande",
        variant: "destructive"
      });
    }
  };

  const closeSecureConfirmation = () => {
    setShowSecureConfirmation(false);
    setSelectedRequest(null);
  };

  return {
    withdrawalRequests,
    pendingRequests: withdrawalRequests, // Alias pour compatibilité
    selectedRequest,
    showSecureConfirmation,
    handleNotificationClick,
    handleSecureConfirm,
    handleSecureReject,
    closeSecureConfirmation
  };
};
