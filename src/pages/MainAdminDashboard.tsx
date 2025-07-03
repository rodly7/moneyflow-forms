
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Shield, LogOut, RefreshCw, DollarSign, Activity, Settings, Crown, Sparkles, Zap, Star, Flame, Gem } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import UserProfileInfo from "@/components/profile/UserProfileInfo";

interface StatsData {
  totalUsers: number;
  totalAgents: number;
  totalTransactions: number;
  totalBalance: number;
}

const MainAdminDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalAgents: 0,
    totalTransactions: 0,
    totalBalance: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      // Récupérer toutes les statistiques globales
      const { data: users } = await supabase
        .from('profiles')
        .select('id, role, balance');

      const { data: transactions } = await supabase
        .from('transfers')
        .select('amount');

      const totalUsers = users?.filter(u => u.role === 'user').length || 0;
      const totalAgents = users?.filter(u => u.role === 'agent').length || 0;
      const totalBalance = users?.reduce((sum, u) => sum + (u.balance || 0), 0) || 0;
      const totalTransactions = transactions?.length || 0;

      setStats({
        totalUsers,
        totalAgents,
        totalTransactions,
        totalBalance
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
    <div className="min-h-screen w-full bg-gradient-to-br from-red-50 via-orange-50 to-yellow-100 relative overflow-hidden animate-fade-in">
      {/* Enhanced fiery background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-red-600/8 via-orange-600/8 to-yellow-600/8"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-red-400/25 to-orange-400/25 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-orange-400/25 to-yellow-400/25 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-red-300/15 to-orange-300/15 rounded-full blur-3xl animate-bounce-gentle"></div>
        
        {/* Floating powerful particles */}
        <div className="absolute top-10 left-10 w-6 h-6 bg-red-500/70 rounded-full animate-pulse shadow-lg"></div>
        <div className="absolute top-20 right-20 w-8 h-8 bg-orange-500/70 rounded-full animate-pulse delay-500 shadow-lg"></div>
        <div className="absolute bottom-20 left-20 w-7 h-7 bg-yellow-500/70 rounded-full animate-pulse delay-1000 shadow-lg"></div>
        <div className="absolute bottom-10 right-10 w-5 h-5 bg-red-400/70 rounded-full animate-pulse delay-1500 shadow-lg"></div>
        <div className="absolute top-1/3 left-1/5 w-4 h-4 bg-orange-400/60 rounded-full animate-bounce-gentle delay-2000"></div>
        <div className="absolute bottom-1/3 right-1/5 w-6 h-6 bg-yellow-400/60 rounded-full animate-bounce-gentle delay-3000"></div>
      </div>
      
      <div className="relative z-10 w-full px-4 py-6 md:py-8">
        {/* Enhanced Supreme Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 backdrop-blur-xl bg-white/25 rounded-3xl p-6 md:p-8 shadow-2xl border border-white/40 w-full hover:shadow-red-500/25 hover:bg-white/30 transition-all duration-500 hover:scale-[1.02]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse-glow">
              <Flame className="w-8 h-8 text-white animate-bounce-gentle" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent">
                🔥 Administration Suprême
              </h1>
              <p className="text-red-700/90 text-base font-semibold">Centre de contrôle maître de SendFlow</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchStats}
              disabled={isLoadingStats}
              className="hover:bg-red-50/80 border-2 border-red-300/50 backdrop-blur-sm bg-white/60 text-red-700 hover:text-red-800 shadow-xl hover:shadow-red-500/30 transition-all duration-300 rounded-2xl font-medium h-12 px-4"
            >
              <RefreshCw className={`w-5 h-5 ${isLoadingStats ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-2">Actualiser</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="text-gray-600 hover:text-gray-700 hover:bg-gray-50/80 border-2 border-gray-300/50 backdrop-blur-sm bg-white/60 shadow-xl hover:shadow-gray-500/30 transition-all duration-300 rounded-2xl font-medium h-12 px-4"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline ml-2">Déconnexion</span>
            </Button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="w-full mb-8">
          <UserProfileInfo />
        </div>

        {/* Enhanced Supreme Stats Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-8">
          <Card className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white border-0 shadow-2xl hover:shadow-blue-500/50 transform hover:-translate-y-3 hover:scale-105 transition-all duration-500 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-purple-400/30 animate-pulse"></div>
            <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <CardContent className="p-8 md:p-10 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles className="w-6 h-6 text-blue-200 animate-pulse" />
                    <p className="text-blue-100 text-base font-semibold">👥 Utilisateurs</p>
                  </div>
                  <p className="text-4xl md:text-5xl font-bold mb-2 drop-shadow-lg">{stats.totalUsers}</p>
                  <p className="text-blue-200 text-sm">Comptes actifs</p>
                </div>
                <div className="w-20 h-20 bg-gradient-to-r from-white/25 to-white/15 rounded-3xl flex items-center justify-center backdrop-blur-sm shadow-xl">
                  <Users className="w-10 h-10 text-white animate-bounce-gentle" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 text-white border-0 shadow-2xl hover:shadow-emerald-500/50 transform hover:-translate-y-3 hover:scale-105 transition-all duration-500 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/30 to-green-400/30 animate-pulse"></div>
            <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <CardContent className="p-8 md:p-10 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Zap className="w-6 h-6 text-emerald-200 animate-pulse" />
                    <p className="text-emerald-100 text-base font-semibold">🛡️ Agents</p>
                  </div>
                  <p className="text-4xl md:text-5xl font-bold mb-2 drop-shadow-lg">{stats.totalAgents}</p>
                  <p className="text-emerald-200 text-sm">Partenaires certifiés</p>
                </div>
                <div className="w-20 h-20 bg-gradient-to-r from-white/25 to-white/15 rounded-3xl flex items-center justify-center backdrop-blur-sm shadow-xl">
                  <Shield className="w-10 h-10 text-white animate-bounce-gentle" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white border-0 shadow-2xl hover:shadow-purple-500/50 transform hover:-translate-y-3 hover:scale-105 transition-all duration-500 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/30 to-pink-400/30 animate-pulse"></div>
            <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <CardContent className="p-8 md:p-10 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Star className="w-6 h-6 text-purple-200 animate-pulse" />
                    <p className="text-purple-100 text-base font-semibold">📊 Transactions</p>
                  </div>
                  <p className="text-4xl md:text-5xl font-bold mb-2 drop-shadow-lg">{stats.totalTransactions}</p>
                  <p className="text-purple-200 text-sm">Opérations totales</p>
                </div>
                <div className="w-20 h-20 bg-gradient-to-r from-white/25 to-white/15 rounded-3xl flex items-center justify-center backdrop-blur-sm shadow-xl">
                  <Activity className="w-10 h-10 text-white animate-bounce-gentle" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white border-0 shadow-2xl hover:shadow-orange-500/50 transform hover:-translate-y-3 hover:scale-105 transition-all duration-500 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400/30 to-red-400/30 animate-pulse"></div>
            <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <CardContent className="p-8 md:p-10 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Gem className="w-6 h-6 text-orange-200 animate-pulse" />
                    <p className="text-orange-100 text-base font-semibold">💰 Solde Total</p>
                  </div>
                  <p className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-lg">{(stats.totalBalance / 1000).toFixed(0)}K XAF</p>
                  <p className="text-orange-200 text-sm">Fonds disponibles</p>
                </div>
                <div className="w-20 h-20 bg-gradient-to-r from-white/25 to-white/15 rounded-3xl flex items-center justify-center backdrop-blur-sm shadow-xl">
                  <DollarSign className="w-10 h-10 text-white animate-bounce-gentle" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Supreme Services Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Gestion Utilisateurs */}
          <Card className="bg-white/35 backdrop-blur-xl border-2 border-white/30 shadow-2xl hover:shadow-blue-500/40 transform hover:-translate-y-3 hover:scale-105 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 to-indigo-50/60"></div>
            <CardHeader className="pb-4 relative z-10">
              <CardTitle className="flex items-center gap-3 text-blue-800">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl flex items-center justify-center shadow-xl">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <span className="text-lg font-bold">👥 Gestion Utilisateurs</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-blue-700 mb-6 font-medium text-sm">
                Gérez tous les utilisateurs, agents et sous-administrateurs de la plateforme avec autorité suprême.
              </p>
              <Button 
                onClick={() => navigate('/admin/users')}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold h-14 shadow-2xl hover:shadow-blue-500/40 transform hover:-translate-y-1 transition-all duration-300 rounded-2xl text-base"
              >
                🔧 Gérer les utilisateurs
              </Button>
            </CardContent>
          </Card>

          {/* Rapports des Agents */}
          <Card className="bg-white/35 backdrop-blur-xl border-2 border-white/30 shadow-2xl hover:shadow-emerald-500/40 transform hover:-translate-y-3 hover:scale-105 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 to-green-50/60"></div>
            <CardHeader className="pb-4 relative z-10">
              <CardTitle className="flex items-center gap-3 text-emerald-800">
                <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-green-500 rounded-3xl flex items-center justify-center shadow-xl">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <span className="text-lg font-bold">📊 Rapports des Agents</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-emerald-700 mb-6 font-medium text-sm">
                Consultez les rapports détaillés: journaliers, hebdomadaires, mensuels et annuels des agents.
              </p>
              <Button 
                onClick={() => navigate('/admin/agent-reports')}
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold h-14 shadow-2xl hover:shadow-emerald-500/40 transform hover:-translate-y-1 transition-all duration-300 rounded-2xl text-base"
              >
                📈 Voir les rapports
              </Button>
            </CardContent>
          </Card>

          {/* Système de Trésorerie */}
          <Card className="bg-white/35 backdrop-blur-xl border-2 border-white/30 shadow-2xl hover:shadow-purple-500/40 transform hover:-translate-y-3 hover:scale-105 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/60 to-pink-50/60"></div>
            <CardHeader className="pb-4 relative z-10">
              <CardTitle className="flex items-center gap-3 text-purple-800">
                <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-xl">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <span className="text-lg font-bold">💰 Système de Trésorerie</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-purple-700 mb-6 font-medium text-sm">
                Gérez les flux de trésorerie, agents fiables et équilibrage stratégique des soldes.
              </p>
              <Button 
                onClick={() => navigate('/admin/treasury')}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold h-14 shadow-2xl hover:shadow-purple-500/40 transform hover:-translate-y-1 transition-all duration-300 rounded-2xl text-base"
              >
                🏦 Accéder à la trésorerie
              </Button>
            </CardContent>
          </Card>

          {/* Paramètres */}
          <Card className="bg-white/35 backdrop-blur-xl border-2 border-white/30 shadow-2xl hover:shadow-orange-500/40 transform hover:-translate-y-3 hover:scale-105 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50/60 to-red-50/60"></div>
            <CardHeader className="pb-4 relative z-10">
              <CardTitle className="flex items-center gap-3 text-orange-800">
                <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl flex items-center justify-center shadow-xl">
                  <Settings className="w-7 h-7 text-white" />
                </div>
                <span className="text-lg font-bold">⚙️ Paramètres</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <p className="text-orange-700 mb-6 font-medium text-sm">
                Configurez les paramètres système et les limites de transaction avec contrôle total.
              </p>
              <Button 
                onClick={() => navigate('/admin/settings')}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold h-14 shadow-2xl hover:shadow-orange-500/40 transform hover:-translate-y-1 transition-all duration-300 rounded-2xl text-base"
              >
                ⚙️ Paramètres système
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MainAdminDashboard;
