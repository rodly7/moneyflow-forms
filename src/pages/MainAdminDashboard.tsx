import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, DollarSign, TrendingUp, Activity, MapPin, Wifi, LogOut, User, Bell } from 'lucide-react';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import { useActiveAgentLocations } from '@/hooks/useAgentLocations';
import { useAuth } from '@/contexts/AuthContext';
import AgentsPerformanceTable from '@/components/admin/AgentsPerformanceTable';
import CommissionSummaryCard from '@/components/admin/CommissionSummaryCard';
import AnomaliesCard from '@/components/admin/AnomaliesCard';
import AgentLocationMap from '@/components/admin/AgentLocationMap';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface OnlineUser {
  id: string;
  full_name: string;
  role: string;
  country: string;
  last_sign_in_at: string;
}

const OnlineUsersCard = () => {
  const { data: onlineUsers, isLoading } = useQuery({
    queryKey: ['online-users'],
    queryFn: async () => {
      // Considérer qu'un utilisateur est en ligne s'il s'est connecté dans les 15 dernières minutes
      const fifteenMinutesAgo = new Date();
      fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

      const { data: authUsers, error } = await supabase
        .from('auth_users_agents_view')
        .select('id, last_sign_in_at')
        .gte('last_sign_in_at', fifteenMinutesAgo.toISOString());

      if (error) throw error;

      if (!authUsers.length) return { agents: [], users: [], total: 0 };

      const userIds = authUsers.map(u => u.id);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, role, country')
        .in('id', userIds);

      if (profilesError) throw profilesError;

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

      const agents = onlineUsersWithProfiles.filter(u => u.role === 'agent');
      const users = onlineUsersWithProfiles.filter(u => u.role === 'user');

      return {
        agents,
        users,
        total: onlineUsersWithProfiles.length
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="w-5 h-5 text-green-500" />
            Utilisateurs en Ligne
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="w-5 h-5 text-green-500" />
          Utilisateurs en Ligne
          <Badge variant="outline" className="ml-auto">
            {onlineUsers?.total || 0}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700">Agents</span>
              <Badge className="bg-blue-500">
                {onlineUsers?.agents.length || 0}
              </Badge>
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-700">Clients</span>
              <Badge className="bg-green-500">
                {onlineUsers?.users.length || 0}
              </Badge>
            </div>
          </div>
        </div>

        {/* Liste des utilisateurs en ligne */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Activité Récente
          </h4>
          
          {onlineUsers?.agents.concat(onlineUsers.users).map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.full_name}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" />
                  <span>{user.country}</span>
                  <span className="ml-2">
                    {new Date(user.last_sign_in_at).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
              <Badge 
                className={user.role === 'agent' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}
                variant="secondary"
              >
                {user.role === 'agent' ? 'Agent' : 'Client'}
              </Badge>
            </div>
          ))}

          {(!onlineUsers || onlineUsers.total === 0) && (
            <div className="text-center py-4 text-gray-500">
              <Wifi className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Aucun utilisateur en ligne</p>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
        </div>
      </CardContent>
    </Card>
  );
};

const MainAdminDashboard = () => {
  const { data: dashboardData, isLoading } = useAdminDashboardData();
  const { data: agentLocations, isLoading: isLoadingLocations } = useActiveAgentLocations();
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header avec informations admin */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Tableau de Bord Administrateur
            </h1>
            <p className="text-gray-600 mt-2">Vue d'ensemble des performances et activités</p>
          </div>
          
          {/* Profil administrateur */}
          <Card className="w-80">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback>
                    <User className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{profile?.full_name || 'Administrateur'}</p>
                  <p className="text-sm text-gray-500">{profile?.phone}</p>
                  <Badge variant="outline" className="text-xs mt-1">
                    {profile?.role === 'admin' ? 'Administrateur' : 'Sous-Administrateur'}
                  </Badge>
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline">
                    <Bell className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Première ligne - Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Utilisateurs en ligne */}
          <OnlineUsersCard />
          
          {/* Commissions */}
          <CommissionSummaryCard data={dashboardData} isLoading={isLoading} />
          
          {/* Activité */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Activité Système
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Total agents</span>
                  <Badge variant="outline" className="border-green-500 text-green-700">
                    {dashboardData?.totalAgents || 0}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Agents localisés</span>
                  <Badge variant="outline" className="border-green-500 text-green-700">
                    {agentLocations?.length || 0}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Anomalies */}
          <AnomaliesCard anomalies={dashboardData?.anomalies || []} isLoading={isLoading} />
        </div>

        {/* Deuxième ligne - Géolocalisation */}
        <div className="grid grid-cols-1 xl:grid-cols-1 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">Géolocalisation des Agents</h2>
              <Badge variant="outline" className="ml-auto">
                <Wifi className="w-3 h-3 mr-1" />
                {agentLocations?.filter(a => a.is_active).length || 0} actifs
              </Badge>
            </div>
            <AgentLocationMap 
              agents={agentLocations || []} 
              isLoading={isLoadingLocations}
            />
          </div>
        </div>

        {/* Troisième ligne - Tableaux détaillés */}
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Performance des Agents
            </h2>
            <AgentsPerformanceTable agents={dashboardData?.agents || []} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainAdminDashboard;