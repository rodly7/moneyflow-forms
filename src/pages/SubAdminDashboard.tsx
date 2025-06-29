import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, TrendingUp, Shield, LogOut, RefreshCw, DollarSign, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Définition simple de l'interface pour éviter la récursion de types
interface StatsData {
  totalUsers: number;
  totalAgents: number;
  totalTransactions: number;
  totalBalance: number;
}

const SubAdminDashboard = () => {
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
      // Récupérer les statistiques pour le pays du sous-admin
      const { data: users } = await supabase
        .from('profiles')
        .select('id, role, balance')
        .eq('country', profile?.country)
        .neq('role', 'admin');

      const { data: transactions } = await supabase
        .from('transfers')
        .select('amount')
        .eq('recipient_country', profile?.country);

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
    if (profile?.country) {
      fetchStats();
    }
  }, [profile]);

  if (!profile || profile.role !== 'sub_admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Accès refusé</h2>
            <p className="text-gray-600 mb-6">Cette page est réservée aux sous-administrateurs.</p>
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
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 md:w-64 md:h-64 bg-indigo-200/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 md:w-96 md:h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-4 md:py-8 max-w-6xl">
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
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Sous-Administration
              </h1>
              <p className="text-sm text-gray-600">
                Gestion pour {profile.country}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Utilisateurs</p>
                  <p className="text-2xl md:text-3xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-emerald-600 to-green-600 text-white border-0 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Agents</p>
                  <p className="text-2xl md:text-3xl font-bold">{stats.totalAgents}</p>
                </div>
                <Shield className="w-8 h-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Transactions</p>
                  <p className="text-2xl md:text-3xl font-bold">{stats.totalTransactions}</p>
                </div>
                <Activity className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-600 to-red-600 text-white border-0 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Solde Total</p>
                  <p className="text-xl md:text-2xl font-bold">{(stats.totalBalance / 1000).toFixed(0)}K XAF</p>
                </div>
                <DollarSign className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Gestion Utilisateurs */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-blue-600">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                Gestion Utilisateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Gérez les utilisateurs et agents de {profile.country}.
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  • Voir les profils utilisateurs
                </p>
                <p className="text-sm text-gray-500">
                  • Gérer les agents
                </p>
                <p className="text-sm text-gray-500">
                  • Statistiques régionales
                </p>
              </div>
              <Button 
                className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold h-12 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Accéder à la gestion
              </Button>
            </CardContent>
          </Card>

          {/* Rapports et Statistiques */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-emerald-600">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                Rapports & Analyses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Consultez les rapports détaillés pour votre région.
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  • Rapports de transactions
                </p>
                <p className="text-sm text-gray-500">
                  • Analyses de performance
                </p>
                <p className="text-sm text-gray-500">
                  • Statistiques temporelles
                </p>
              </div>
              <Button 
                className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold h-12 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Voir les rapports
              </Button>
            </CardContent>
          </Card>

          {/* Support et Assistance */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-purple-600">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                Support & Assistance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Outils de support et assistance utilisateurs.
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  • Support technique
                </p>
                <p className="text-sm text-gray-500">
                  • Résolution de problèmes
                </p>
                <p className="text-sm text-gray-500">
                  • Communication utilisateurs
                </p>
              </div>
              <Button 
                className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold h-12 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Outils de support
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-gray-800">Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Button 
                  onClick={fetchStats}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-20 border-2 border-blue-200 hover:bg-blue-50 transition-all duration-200"
                  disabled={isLoadingStats}
                >
                  <RefreshCw className={`w-5 h-5 text-blue-600 ${isLoadingStats ? 'animate-spin' : ''}`} />
                  <span className="text-xs">Actualiser</span>
                </Button>
                
                <Button 
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-20 border-2 border-emerald-200 hover:bg-emerald-50 transition-all duration-200"
                >
                  <Users className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs">Utilisateurs</span>
                </Button>
                
                <Button 
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-20 border-2 border-purple-200 hover:bg-purple-50 transition-all duration-200"
                >
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <span className="text-xs">Rapports</span>
                </Button>
                
                <Button 
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-20 border-2 border-orange-200 hover:bg-orange-50 transition-all duration-200"
                >
                  <Shield className="w-5 h-5 text-orange-600" />
                  <span className="text-xs">Support</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SubAdminDashboard;
