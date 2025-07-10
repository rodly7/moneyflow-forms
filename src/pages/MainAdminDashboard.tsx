import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Users, DollarSign, TrendingUp, Activity, MapPin, Wifi, LogOut, User, Bell, 
  Settings, Menu, Wallet, UserPlus, MessageSquare, BarChart3, Database
} from 'lucide-react';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import { useActiveAgentLocations } from '@/hooks/useAgentLocations';
import { useAuth } from '@/contexts/AuthContext';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import AgentsPerformanceTable from '@/components/admin/AgentsPerformanceTable';
import CommissionSummaryCard from '@/components/admin/CommissionSummaryCard';
import AnomaliesCard from '@/components/admin/AnomaliesCard';
import AgentLocationMap from '@/components/admin/AgentLocationMap';
import UsersDataTable from '@/components/admin/UsersDataTable';
import AdminSelfRecharge from '@/components/admin/AdminSelfRecharge';
import NotificationSender from '@/components/admin/NotificationSender';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { AdminUserService, AdminUserData } from '@/services/adminUserService';

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
  const navigate = useNavigate();
  const { isMobile, isTablet } = useDeviceDetection();
  
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch users function
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const result = await AdminUserService.fetchAllUsers();
      if (result.success) {
        setUsers(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

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

  // Navigation items
  const navItems = [
    { id: "dashboard", label: "Tableau de Bord", icon: BarChart3 },
    { id: "users", label: "Gestion Utilisateurs", icon: Users },
    { id: "finance", label: "Finance", icon: Wallet },
    { id: "notifications", label: "Notifications", icon: MessageSquare },
    { id: "settings", label: "Paramètres", icon: Settings }
  ];

  // Mobile navigation
  const MobileNav = () => (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="md:hidden">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold">Navigation</h2>
            <div className="space-y-1">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header responsive */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Logo et titre */}
            <div className="flex items-center gap-4">
              <MobileNav />
              <div>
                <h1 className={`font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ${
                  isMobile ? 'text-xl' : 'text-2xl'
                }`}>
                  Admin Dashboard
                </h1>
                {!isMobile && (
                  <p className="text-gray-600 text-sm">Vue d'ensemble et gestion complète</p>
                )}
              </div>
            </div>

            {/* Profil administrateur responsive */}
            <div className="flex items-center gap-3">
              <Avatar className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'}`}>
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback>
                  <User className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                </AvatarFallback>
              </Avatar>
              
              {!isMobile && (
                <div className="text-right">
                  <p className="font-semibold text-gray-900 text-sm">
                    {profile?.full_name || 'Administrateur'}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {profile?.role === 'admin' ? 'Admin' : 'Sub-Admin'}
                  </Badge>
                </div>
              )}
              
              <div className="flex gap-1">
                {!isMobile && (
                  <Button size="sm" variant="outline" className="p-2">
                    <Bell className="h-4 w-4" />
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={handleSignOut}
                  className="p-2"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation responsive */}
      <div className="max-w-7xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Navigation Desktop */}
          {!isMobile && (
            <TabsList className="grid w-full grid-cols-5 mb-6">
              {navItems.map((item) => (
                <TabsTrigger key={item.id} value={item.id} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  {!isTablet && item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          )}

          {/* Navigation Mobile (dans le drawer) */}

          {/* Contenu des onglets */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Statistiques principales - responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <OnlineUsersCard />
              <CommissionSummaryCard data={dashboardData} isLoading={isLoading} />
              
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

              <AnomaliesCard anomalies={dashboardData?.anomalies || []} isLoading={isLoading} />
            </div>

            {/* Géolocalisation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Géolocalisation des Agents
                  <Badge variant="outline" className="ml-auto">
                    <Wifi className="w-3 h-3 mr-1" />
                    {agentLocations?.filter(a => a.is_active).length || 0} actifs
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AgentLocationMap 
                  agents={agentLocations || []} 
                  isLoading={isLoadingLocations}
                />
              </CardContent>
            </Card>

            {/* Performance des agents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Performance des Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AgentsPerformanceTable agents={dashboardData?.agents || []} isLoading={isLoading} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gestion des utilisateurs */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Gestion des Utilisateurs
                </CardTitle>
                <Button onClick={fetchUsers} disabled={loadingUsers} size="sm">
                  Actualiser
                </Button>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="animate-pulse space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : (
                  <UsersDataTable 
                    users={users} 
                    onViewUser={(user) => console.log('View user:', user)}
                    onQuickRoleChange={async (userId, newRole) => {
                      try {
                        const result = await AdminUserService.changeUserRole(userId, newRole, profile?.id);
                        if (result.success) {
                          setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
                          toast({ title: "Rôle mis à jour", description: result.message });
                        }
                      } catch (error) {
                        toast({ title: "Erreur", variant: "destructive" });
                      }
                    }}
                    onQuickBanToggle={async (userId, currentBanStatus) => {
                      try {
                        const result = await AdminUserService.toggleUserBan(userId, currentBanStatus, 'Action administrative', profile?.id);
                        if (result.success) {
                          setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: !currentBanStatus } : u));
                          toast({ title: "Statut mis à jour", description: result.message });
                        }
                      } catch (error) {
                        toast({ title: "Erreur", variant: "destructive" });
                      }
                    }}
                    onUserUpdated={fetchUsers}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Finance */}
          <TabsContent value="finance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    Recharge Administrateur
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AdminSelfRecharge />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Statistiques Financières
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-600">Commissions Totales</p>
                        <p className="text-xl font-bold text-blue-800">
                          {dashboardData?.totalCommissions?.toLocaleString() || 0} XAF
                        </p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-600">Volume Total</p>
                        <p className="text-xl font-bold text-green-800">
                          {((dashboardData?.totalVolume || 0) / 1000000).toFixed(1)}M XAF
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Envoi de Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <NotificationSender />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Paramètres */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Configuration Système
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Base de données</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-green-600">Opérationnelle</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>API Supabase</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-green-600">Connectée</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Authentification</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-green-600">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Actions Administrateur
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate('/admin-users')}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Gestion Avancée des Utilisateurs
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate('/admin-balance-update')}
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      Mise à Jour des Soldes
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => navigate('/admin-notifications')}
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      Notifications Avancées
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MainAdminDashboard;