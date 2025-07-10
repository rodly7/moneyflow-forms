import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Wifi, MapPin, Clock } from 'lucide-react';
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'agent':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-green-100 text-green-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'sub_admin':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
                  <Clock className="w-3 h-3 ml-2" />
                  <span>
                    {new Date(user.last_sign_in_at).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
              <Badge 
                className={getRoleColor(user.role)}
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

export default OnlineUsersCard;