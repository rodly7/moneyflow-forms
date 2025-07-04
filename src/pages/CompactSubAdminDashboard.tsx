import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Users, Shield, DollarSign, Activity, Eye, UserPlus, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import UserProfileInfo from "@/components/profile/UserProfileInfo";
import UsersDataTable from "@/components/admin/UsersDataTable";
import BatchAgentDeposit from "@/components/admin/BatchAgentDeposit";
import UserManagementModal from "@/components/admin/UserManagementModal";
import { useSubAdmin } from "@/hooks/useSubAdmin";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { usePerformanceMonitor, useDebounce } from "@/hooks/usePerformanceOptimization";
import CompactHeader from "@/components/dashboard/CompactHeader";
import CompactStatsGrid from "@/components/dashboard/CompactStatsGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StatsData {
  totalUsers: number;
  totalAgents: number;
  totalTransactions: number;
  totalBalance: number;
}

interface UserData {
  id: string;
  full_name: string | null;
  phone: string;
  balance: number;
  country: string | null;
  role: 'user' | 'agent' | 'admin' | 'sub_admin';
  is_banned?: boolean;
  banned_reason?: string | null;
  created_at: string;
}

const CompactSubAdminDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSubAdmin, canDepositToAgent } = useSubAdmin();
  const deviceInfo = useDeviceDetection();
  const { renderCount } = usePerformanceMonitor('CompactSubAdminDashboard');
  
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalAgents: 0,
    totalTransactions: 0,
    totalBalance: 0
  });
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showBatchDeposit, setShowBatchDeposit] = useState(false);

  const fetchStats = useDebounce(async () => {
    setIsLoadingStats(true);
    try {
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('id, role, balance, country')
        .order('created_at', { ascending: false });

      const { data: transactions } = await supabase
        .from('transfers')
        .select('amount');

      if (allUsers) {
        const totalUsers = allUsers.filter(u => u.role === 'user').length;
        const totalAgents = allUsers.filter(u => u.role === 'agent').length;
        const totalBalance = allUsers.reduce((sum, u) => sum + (u.balance || 0), 0);
        const totalTransactions = transactions?.length || 0;

        setStats({
          totalUsers,
          totalAgents,
          totalTransactions,
          totalBalance
        });
      }
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

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive"
      });
    }
  };

  const handleViewUser = (user: UserData) => {
    setSelectedUser(user);
    setShowUserModal(true);
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
    if (profile?.role !== 'sub_admin') {
      navigate('/dashboard');
      return;
    }
    fetchStats();
    fetchUsers();
  }, [profile, navigate]);

  if (!profile || profile.role !== 'sub_admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-destructive rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-destructive-foreground" />
            </div>
            <h2 className="text-xl font-bold text-destructive mb-2">Accès refusé</h2>
            <p className="text-muted-foreground mb-4">Cette page est réservée aux sous-administrateurs.</p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
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

  return (
    <div className="min-h-screen bg-background p-3">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>

        <CompactHeader
          title="Sous-Administration"
          subtitle="Panneau de contrôle"
          icon={<Shield className="w-4 h-4 text-primary-foreground" />}
          onRefresh={() => {
            fetchStats();
            fetchUsers();
          }}
          onSignOut={handleSignOut}
          isLoading={isLoadingStats}
          showNotifications={false}
        />

        <div className="bg-card p-3 rounded-lg">
          <UserProfileInfo />
        </div>

        <CompactStatsGrid stats={statsData} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Vue d'ensemble</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Consultation</span>
            </TabsTrigger>
            <TabsTrigger value="deposits" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Dépôts</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Tableau de bord principal</h3>
                <p className="text-sm text-muted-foreground">
                  Visualisez les statistiques générales et gérez les opérations.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <UsersDataTable 
                  users={users}
                  onViewUser={handleViewUser}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deposits" className="space-y-4">
            {canDepositToAgent && (
              <Card>
                <CardContent className="p-4">
                  <BatchAgentDeposit onBack={() => setActiveTab("overview")} />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {showUserModal && selectedUser && (
          <UserManagementModal
            user={selectedUser}
            isOpen={showUserModal}
            onClose={() => {
              setShowUserModal(false);
              setSelectedUser(null);
            }}
            onUserUpdated={fetchUsers}
          />
        )}
      </div>
    </div>
  );
};

export default CompactSubAdminDashboard;