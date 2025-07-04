
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Shield, LogOut, RefreshCw, DollarSign, Activity, Settings, Crown, Sparkles, Zap, Star, Flame, Gem } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import UserProfileInfo from "@/components/profile/UserProfileInfo";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { usePerformanceMonitor, useDebounce } from "@/hooks/usePerformanceOptimization";
import CompactHeader from "@/components/dashboard/CompactHeader";
import CompactStatsGrid from "@/components/dashboard/CompactStatsGrid";
import CompactActionGrid from "@/components/dashboard/CompactActionGrid";

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
  const deviceInfo = useDeviceDetection();
  const { renderCount } = usePerformanceMonitor('MainAdminDashboard');
  
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalAgents: 0,
    totalTransactions: 0,
    totalBalance: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const fetchStats = useDebounce(async () => {
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
  }, 300);

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

  // Stats pour le grid compact
  const statsData = [
    {
      label: "Utilisateurs",
      value: stats.totalUsers,
      icon: Users,
      gradient: "bg-gradient-to-r from-blue-600 to-indigo-600",
      textColor: "text-blue-100"
    },
    {
      label: "Agents",
      value: stats.totalAgents,
      icon: Shield,
      gradient: "bg-gradient-to-r from-emerald-600 to-teal-600",
      textColor: "text-emerald-100"
    },
    {
      label: "Transactions",
      value: stats.totalTransactions,
      icon: Activity,
      gradient: "bg-gradient-to-r from-purple-600 to-pink-600",
      textColor: "text-purple-100"
    },
    {
      label: "Solde Total",
      value: `${(stats.totalBalance / 1000).toFixed(0)}K XAF`,
      icon: DollarSign,
      gradient: "bg-gradient-to-r from-orange-600 to-red-600",
      textColor: "text-orange-100"
    }
  ];

  // Actions pour l'admin
  const actionItems = [
    {
      label: "Gérer les utilisateurs",
      icon: Users,
      onClick: () => navigate('/admin/users'),
      variant: "default" as const
    },
    {
      label: "Voir les rapports",
      icon: TrendingUp,
      onClick: () => navigate('/admin/agent-reports'),
      variant: "outline" as const
    },
    {
      label: "Système de trésorerie",
      icon: DollarSign,
      onClick: () => navigate('/admin/treasury'),
      variant: "outline" as const
    }
  ];

  return (
    <div className="min-h-screen bg-background p-3">
      <div className="max-w-6xl mx-auto space-y-4">
        <CompactHeader
          title="Administration"
          subtitle="Contrôle principal"
          icon={<Shield className="w-4 h-4 text-primary-foreground" />}
          onRefresh={fetchStats}
          onSignOut={handleSignOut}
          isLoading={isLoadingStats}
          showNotifications={false}
        />

        <div className="bg-card p-3 rounded-lg">
          <UserProfileInfo />
        </div>

        <CompactStatsGrid stats={statsData} />

        <CompactActionGrid
          title="Services d'administration"
          titleIcon={Settings}
          actions={actionItems}
        />
      </div>
    </div>
  );
};

export default MainAdminDashboard;
