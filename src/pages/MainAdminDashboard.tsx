
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, TrendingUp, Shield, Settings, LogOut, RefreshCw, DollarSign, Activity, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import TransactionMonitor from "@/components/admin/TransactionMonitor";
import BatchAgentRecharge from "@/components/admin/BatchAgentRecharge";
import NotificationSender from "@/components/admin/NotificationSender";

const MainAdminDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAgents: 0,
    totalTransactions: 0,
    totalBalance: 0,
    todayTransactions: 0,
    todayVolume: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      // Récupérer les statistiques générales
      const { data: users } = await supabase
        .from('profiles')
        .select('id, role, balance')
        .neq('role', 'admin');

      const { data: transactions } = await supabase
        .from('transfers')
        .select('amount, created_at');

      const totalUsers = users?.filter(u => u.role === 'user').length || 0;
      const totalAgents = users?.filter(u => u.role === 'agent').length || 0;
      const totalBalance = users?.reduce((sum, u) => sum + (u.balance || 0), 0) || 0;
      const totalTransactions = transactions?.length || 0;

      // Transactions d'aujourd'hui
      const today = new Date().toISOString().split('T')[0];
      const todayTransactions = transactions?.filter(t => 
        t.created_at.startsWith(today)
      ).length || 0;
      
      const todayVolume = transactions?.filter(t => 
        t.created_at.startsWith(today)
      ).reduce((sum, t) => sum + t.amount, 0) || 0;

      setStats({
        totalUsers,
        totalAgents,
        totalTransactions,
        totalBalance,
        todayTransactions,
        todayVolume
      });
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive"
      });
    }
    setIsLoadingStats(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Accès refusé</h2>
            <p className="text-gray-600 mb-6">Cette page est réservée aux administrateurs.</p>
            <Button 
              onClick={() => navigate('/dashboard')} 
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 md:w-64 md:h-64 bg-purple-200/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 md:w-96 md:h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-4 md:py-8 max-w-7xl">
        {/* Enhanced Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 backdrop-blur-sm bg-white/70 rounded-2xl p-4 md:p-6 shadow-lg border border-white/20">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')} 
              className="text-gray-700 hover:bg-blue-50 border border-blue-200 hover:border-blue-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Retour</span>
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Administration Principale
              </h1>
              <p className="text-sm text-gray-600 hidden sm:block">
                Gestion complète de la plateforme
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchStats}
              disabled={isLoadingStats}
              className="hover:bg-green-50 border border-green-200"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-1">Actualiser</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Déconnexion</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6 mb-6">
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs">Utilisateurs</p>
                  <p className="text-xl md:text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="w-6 h-6 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-emerald-600 to-green-600 text-white border-0 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-xs">Agents</p>
                  <p className="text-xl md:text-2xl font-bold">{stats.totalAgents}</p>
                </div>
                <Shield className="w-6 h-6 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-xs">Transactions</p>
                  <p className="text-xl md:text-2xl font-bold">{stats.totalTransactions}</p>
                </div>
                <Activity className="w-6 h-6 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-600 to-red-600 text-white border-0 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-xs">Solde Total</p>
                  <p className="text-lg md:text-xl font-bold">{(stats.totalBalance / 1000).toFixed(0)}K</p>
                </div>
                <DollarSign className="w-6 h-6 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white border-0 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100 text-xs">Auj. Trans.</p>
                  <p className="text-xl md:text-2xl font-bold">{stats.todayTransactions}</p>
                </div>
                <TrendingUp className="w-6 h-6 text-teal-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-xs">Vol. Auj.</p>
                  <p className="text-lg md:text-xl font-bold">{(stats.todayVolume / 1000).toFixed(0)}K</p>
                </div>
                <Bell className="w-6 h-6 text-indigo-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 overflow-hidden">
          <Tabs defaultValue="monitor" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 bg-gray-100/50 m-2 rounded-xl h-auto">
              <TabsTrigger value="monitor" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md h-12">
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Monitoring Transactions</span>
                <span className="sm:hidden">Monitor</span>
              </TabsTrigger>
              <TabsTrigger value="recharge" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md h-12">
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">Recharge Agents</span>
                <span className="sm:hidden">Recharge</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md h-12">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notifications</span>
                <span className="sm:hidden">Notifs</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="monitor" className="p-4 md:p-6">
              <TransactionMonitor />
            </TabsContent>

            <TabsContent value="recharge" className="p-4 md:p-6">
              <BatchAgentRecharge />
            </TabsContent>

            <TabsContent value="notifications" className="p-4 md:p-6">
              <NotificationSender />
            </TabsContent>
          </Tabs>
        </div>

        {/* Quick Actions */}
        <div className="mt-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-gray-800">Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                <Button 
                  onClick={() => navigate('/admin-balance-update')}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-20 border-2 border-blue-200 hover:bg-blue-50"
                >
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span className="text-xs text-center">Gestion Soldes</span>
                </Button>
                
                <Button 
                  onClick={fetchStats}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-20 border-2 border-emerald-200 hover:bg-emerald-50"
                  disabled={isLoadingStats}
                >
                  <RefreshCw className={`w-5 h-5 text-emerald-600 ${isLoadingStats ? 'animate-spin' : ''}`} />
                  <span className="text-xs text-center">Actualiser</span>
                </Button>
                
                <Button 
                  onClick={() => navigate('/dashboard')}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-20 border-2 border-purple-200 hover:bg-purple-50"
                >
                  <ArrowLeft className="w-5 h-5 text-purple-600" />
                  <span className="text-xs text-center">Tableau Bord</span>
                </Button>
                
                <Button 
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-20 border-2 border-orange-200 hover:bg-orange-50"
                >
                  <Settings className="w-5 h-5 text-orange-600" />
                  <span className="text-xs text-center">Paramètres</span>
                </Button>
                
                <Button 
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-20 border-2 border-red-200 hover:bg-red-50"
                >
                  <Users className="w-5 h-5 text-red-600" />
                  <span className="text-xs text-center">Utilisateurs</span>
                </Button>
                
                <Button 
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-20 border-2 border-indigo-200 hover:bg-indigo-50"
                >
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs text-center">Rapports</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MainAdminDashboard;
