import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface OnlineUser {
  id: string;
  full_name: string;
  role: string;
  country: string;
  last_sign_in_at: string;
}

export interface SystemStatusData {
  component: string;
  status_type: 'operational' | 'maintenance' | 'degraded' | 'offline';
  description: string;
  is_active: boolean;
  updated_at: string;
}

export interface SystemMetrics {
  onlineUsers: {
    total: number;
    agents: OnlineUser[];
    users: OnlineUser[];
  };
  systemStatus: SystemStatusData[];
  agentLocations: number;
  anomalies: Array<{
    id: string;
    type: string;
    description: string;
    amount?: number;
    created_at: string;
  }>;
  agentPerformance: {
    totalAgents: number;
    activeAgents: number;
    averagePerformance: number;
  };
}

export const useSystemMetrics = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['system-metrics', user?.id],
    queryFn: async (): Promise<SystemMetrics> => {
      const now = new Date();
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

      // 1. Récupérer les utilisateurs en ligne
      const { data: authUsers } = await supabase
        .from('auth_users_agents_view')
        .select('id, last_sign_in_at')
        .gte('last_sign_in_at', fifteenMinutesAgo.toISOString());

      let onlineUsers = { total: 0, agents: [], users: [] };

      if (authUsers?.length) {
        const userIds = authUsers.map(u => u.id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, role, country')
          .in('id', userIds);

        const onlineUsersWithProfiles = authUsers
          .map(authUser => {
            const profile = profiles?.find(p => p.id === authUser.id);
            if (!profile) return null;
            return {
              ...profile,
              last_sign_in_at: authUser.last_sign_in_at
            };
          })
          .filter(Boolean) as OnlineUser[];

        onlineUsers = {
          total: onlineUsersWithProfiles.length,
          agents: onlineUsersWithProfiles.filter(u => u.role === 'agent'),
          users: onlineUsersWithProfiles.filter(u => u.role === 'user')
        };
      }

      // 2. Récupérer le statut du système
      const { data: systemStatusRaw = [] } = await supabase
        .from('system_status')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      const systemStatus: SystemStatusData[] = systemStatusRaw.map(status => ({
        component: status.component,
        status_type: status.status_type as 'operational' | 'maintenance' | 'degraded' | 'offline',
        description: status.description,
        is_active: status.is_active,
        updated_at: status.updated_at
      }));

      // 3. Compter les agents avec géolocalisation active
      const { count: agentLocationsCount } = await supabase
        .from('agent_locations')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // 4. Récupérer les anomalies récentes
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const { data: cancelledTransfers } = await supabase
        .from('transfers')
        .select('id, amount, created_at, recipient_full_name')
        .eq('status', 'cancelled')
        .gte('created_at', sevenDaysAgo.toISOString())
        .limit(5);

      const { data: suspiciousTransfers } = await supabase
        .from('transfers')
        .select('id, amount, created_at, recipient_full_name')
        .gte('amount', 500000)
        .gte('created_at', sevenDaysAgo.toISOString())
        .limit(5);

      const anomalies = [
        ...(cancelledTransfers?.map(t => ({
          id: t.id,
          type: 'cancelled_transfer',
          description: `Transfert annulé: ${t.amount.toLocaleString()} XAF vers ${t.recipient_full_name}`,
          amount: t.amount,
          created_at: t.created_at
        })) || []),
        ...(suspiciousTransfers?.map(t => ({
          id: t.id,
          type: 'high_volume',
          description: `Transfert important: ${t.amount.toLocaleString()} XAF vers ${t.recipient_full_name}`,
          amount: t.amount,
          created_at: t.created_at
        })) || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // 5. Récupérer les performances des agents
      const { data: agentsData } = await supabase
        .from('agents')
        .select('user_id, status');

      const totalAgents = agentsData?.length || 0;
      const activeAgents = agentsData?.filter(a => a.status === 'active').length || 0;

      // Calculer la performance moyenne (basée sur les commissions du mois actuel)
      const { data: performanceData } = await supabase
        .from('agent_monthly_performance')
        .select('total_earnings')
        .eq('month', now.getMonth() + 1)
        .eq('year', now.getFullYear());

      const averagePerformance = performanceData?.length 
        ? performanceData.reduce((sum, p) => sum + (p.total_earnings || 0), 0) / performanceData.length
        : 0;

      return {
        onlineUsers,
        systemStatus,
        agentLocations: agentLocationsCount || 0,
        anomalies: anomalies.slice(0, 10),
        agentPerformance: {
          totalAgents,
          activeAgents,
          averagePerformance
        }
      };
    },
    refetchInterval: 30000, // Actualisation toutes les 30 secondes
    enabled: !!user,
  });
};

// Hook pour mettre à jour automatiquement la position d'un agent
export const useAgentLocationTracker = () => {
  const { user, profile } = useAuth();

  const updateLocation = async (latitude: number, longitude: number, address: string) => {
    if (!user?.id || profile?.role !== 'agent') return;

    try {
      const { error } = await supabase.rpc('update_agent_location', {
        p_agent_id: user.id,
        p_latitude: latitude,
        p_longitude: longitude,
        p_address: address
      });

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la position:', error);
    }
  };

  const deactivateLocation = async () => {
    if (!user?.id || profile?.role !== 'agent') return;

    try {
      const { error } = await supabase.rpc('deactivate_agent_location', {
        p_agent_id: user.id
      });

      if (error) throw error;
    } catch (error) {
      console.error('Erreur lors de la désactivation de la position:', error);
    }
  };

  return {
    updateLocation,
    deactivateLocation
  };
};