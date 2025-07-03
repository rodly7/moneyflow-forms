import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, TrendingUp, Shield, LogOut, RefreshCw, DollarSign, Activity, UserPlus, Star, Sparkles, Heart, Gem, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import UserProfileInfo from "@/components/profile/UserProfileInfo";
import NotificationsCard from "@/components/notifications/NotificationsCard";
import UsersDataTable from "@/components/admin/UsersDataTable";
import BatchAgentDeposit from "@/components/admin/BatchAgentDeposit";
import UserManagementModal from "@/components/admin/UserManagementModal";
import { useSubAdmin } from "@/hooks/useSubAdmin";

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

const SubAdminDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSubAdmin, canDepositToAgent } = useSubAdmin();
  
  const [activeTab, setActiveTab] = useState("dashboard");
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

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      // Récupérer tous les utilisateurs (les sous-admins peuvent voir tous les utilisateurs)
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
  };

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

  const handleAutoBatchDeposit = async () => {
    if (!canDepositToAgent) {
      toast({
        title: "Action non autorisée",
        description: "Vous n'avez pas les permissions pour effectuer cette action",
        variant: "destructive"
      });
      return;
    }

    try {
      // Récupérer les agents avec un solde < 50,000
      const { data: lowBalanceAgents, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'agent')
        .lt('balance', 50000);

      if (error) throw error;

      if (!lowBalanceAgents || lowBalanceAgents.length === 0) {
        toast({
          title: "Aucun agent trouvé",
          description: "Aucun agent n'a un solde inférieur à 50,000 FCFA",
        });
        return;
      }

      const depositAmount = 50000;
      const totalAmount = depositAmount * lowBalanceAgents.length;

      // Vérifier le solde du sous-admin
      if (profile && profile.balance < totalAmount) {
        toast({
          title: "Solde insuffisant",
          description: `Solde requis: ${totalAmount.toLocaleString()} FCFA`,
          variant: "destructive"
        });
        return;
      }

      // Effectuer les dépôts
      for (const agent of lowBalanceAgents) {
        await supabase.rpc('increment_balance', {
          user_id: agent.id,
          amount: depositAmount
        });
      }

      // Débiter le sous-admin
      await supabase.rpc('increment_balance', {
        user_id: profile?.id,
        amount: -totalAmount
      });

      toast({
        title: "Dépôts automatiques effectués",
        description: `${lowBalanceAgents.length} agent(s) rechargé(s) de 50,000 FCFA chacun`,
      });

      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('Erreur lors du dépôt automatique:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du dépôt automatique",
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
      toast({
        title: "✨ Déconnexion réussie",
        description: "À bientôt dans votre espace sous-administrateur !",
        className: "bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0",
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      toast({
        title: "❌ Erreur",
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
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-red-100 flex items-center justify-center p-4 animate-fade-in">
        <Card className="w-full max-w-md shadow-2xl border-0 glass hover-lift animate-scale-in">
          <CardContent className="pt-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-gentle shadow-xl">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4">🚫 Accès Refusé</h2>
            <p className="text-gray-600 mb-6 text-lg">Cette page est réservée aux sous-administrateurs privilégiés.</p>
            <Button 
              onClick={() => navigate('/dashboard')} 
              className="w-full btn-gradient text-lg py-3"
              variant="default"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-pink-50 via-rose-50 to-purple-100 relative overflow-hidden animate-fade-in">
      {/* Enhanced elegant background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-pink-600/8 via-rose-600/8 to-purple-600/8"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-pink-400/25 to-rose-400/25 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-rose-400/25 to-purple-400/25 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-pink-300/15 to-rose-300/15 rounded-full blur-3xl animate-bounce-gentle"></div>
        
        {/* Floating elegant particles */}
        <div className="absolute top-10 left-10 w-6 h-6 bg-pink-500/70 rounded-full animate-pulse shadow-lg"></div>
        <div className="absolute top-20 right-20 w-8 h-8 bg-rose-500/70 rounded-full animate-pulse delay-500 shadow-lg"></div>
        <div className="absolute bottom-20 left-20 w-7 h-7 bg-purple-500/70 rounded-full animate-pulse delay-1000 shadow-lg"></div>
        <div className="absolute bottom-10 right-10 w-5 h-5 bg-pink-400/70 rounded-full animate-pulse delay-1500 shadow-lg"></div>
        <div className="absolute top-1/3 left-1/5 w-4 h-4 bg-rose-400/60 rounded-full animate-bounce-gentle delay-2000"></div>
        <div className="absolute bottom-1/3 right-1/5 w-6 h-6 bg-purple-400/60 rounded-full animate-bounce-gentle delay-3000"></div>
      </div>
      
      <div className="relative z-10 w-full px-4 py-6 md:py-8">
        {/* Enhanced Elegant Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 backdrop-blur-xl bg-white/25 rounded-3xl p-6 md:p-8 shadow-2xl border border-white/40 w-full hover:shadow-pink-500/25 hover:bg-white/30 transition-all duration-500 hover:scale-[1.02]">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="glass hover:bg-white/40 rounded-2xl text-pink-700 border-pink-300/30 border backdrop-blur-md shadow-lg hover-lift mr-2"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="font-medium">Retour</span>
            </Button>
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse-glow">
              <Heart className="w-8 h-8 text-white animate-bounce-gentle" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 bg-clip-text text-transparent">
                💖 Sous-Administration Élégante
              </h1>
              <p className="text-pink-700/90 text-base font-semibold">Espace de gestion privilégié et raffiné</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                fetchStats();
                fetchUsers();
              }}
              disabled={isLoadingStats}
              className="hover:bg-pink-50/80 border-2 border-pink-300/50 backdrop-blur-sm bg-white/60 text-pink-700 hover:text-pink-800 shadow-xl hover:shadow-pink-500/30 transition-all duration-300 rounded-2xl font-medium h-12 px-4"
            >
              <RefreshCw className={`w-5 h-5 ${isLoadingStats ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-2">Actualiser</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-700 hover:bg-red-50/80 border-2 border-red-300/50 backdrop-blur-sm bg-white/60 shadow-xl hover:shadow-red-500/30 transition-all duration-300 rounded-2xl font-medium h-12 px-4"
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

        {/* Enhanced Elegant Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-10 animate-slide-up">
          <Card className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white border-0 shadow-2xl hover:shadow-blue-500/50 transform hover:-translate-y-3 hover:scale-105 transition-all duration-500 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-purple-400/30 animate-pulse"></div>
            <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <CardContent className="p-8 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-blue-200 animate-pulse" />
                    <p className="text-blue-100 text-sm font-semibold uppercase tracking-wide">👥 Utilisateurs</p>
                  </div>
                  <p className="text-4xl font-bold mt-2 drop-shadow-lg">{stats.totalUsers}</p>
                  <p className="text-blue-200 text-xs mt-1">Comptes actifs</p>
                </div>
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                  <Users className="w-10 h-10 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 text-white border-0 shadow-2xl hover:shadow-emerald-500/50 transform hover:-translate-y-3 hover:scale-105 transition-all duration-500 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/30 to-green-400/30 animate-pulse"></div>
            <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <CardContent className="p-8 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-emerald-200 animate-pulse" />
                    <p className="text-emerald-100 text-sm font-semibold uppercase tracking-wide">🛡️ Agents</p>
                  </div>
                  <p className="text-4xl font-bold mt-2 drop-shadow-lg">{stats.totalAgents}</p>
                  <p className="text-emerald-200 text-xs mt-1">Partenaires certifiés</p>
                </div>
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                  <Shield className="w-10 h-10 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white border-0 shadow-2xl hover:shadow-purple-500/50 transform hover:-translate-y-3 hover:scale-105 transition-all duration-500 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/30 to-pink-400/30 animate-pulse"></div>
            <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <CardContent className="p-8 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-purple-200 animate-pulse" />
                    <p className="text-purple-100 text-sm font-semibold uppercase tracking-wide">📊 Transactions</p>
                  </div>
                  <p className="text-4xl font-bold mt-2 drop-shadow-lg">{stats.totalTransactions}</p>
                  <p className="text-purple-200 text-xs mt-1">Opérations totales</p>
                </div>
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                  <Activity className="w-10 h-10 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-600 via-pink-600 to-red-600 text-white border-0 shadow-2xl hover:shadow-orange-500/50 transform hover:-translate-y-3 hover:scale-105 transition-all duration-500 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400/30 to-red-400/30 animate-pulse"></div>
            <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <CardContent className="p-8 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Gem className="w-5 h-5 text-orange-200 animate-pulse" />
                    <p className="text-orange-100 text-sm font-semibold uppercase tracking-wide">💰 Solde Total</p>
                  </div>
                  <p className="text-3xl font-bold mt-2 drop-shadow-lg">{(stats.totalBalance / 1000).toFixed(0)}K XAF</p>
                  <p className="text-orange-200 text-xs mt-1">Fonds disponibles</p>
                </div>
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                  <DollarSign className="w-10 h-10 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8 w-full">
          <TabsList className="grid w-full grid-cols-2 glass shadow-2xl rounded-3xl h-20 p-3 backdrop-blur-lg border-white/20 border">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center gap-3 h-14 rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-xl transition-all duration-300 font-semibold text-lg data-[state=active]:text-slate-800 text-white/80"
            >
              <Users className="w-6 h-6" />
              <span>👥 Gestion Utilisateurs</span>
            </TabsTrigger>
            <TabsTrigger 
              value="deposits" 
              className="flex items-center gap-3 h-14 rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-xl transition-all duration-300 font-semibold text-lg data-[state=active]:text-slate-800 text-white/80"
            >
              <UserPlus className="w-6 h-6" />
              <span>💳 Dépôts Agents</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8 w-full animate-fade-in">
            <Card className="glass border-0 shadow-2xl w-full backdrop-blur-lg hover-lift">
              <CardHeader className="bg-gradient-to-r from-blue-50/90 to-indigo-50/90 backdrop-blur-md rounded-t-xl">
                <CardTitle className="flex items-center gap-4 text-2xl">
                  <div className="p-3 bg-blue-500 rounded-2xl text-white shadow-lg">
                    <Users className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      👀 Consultation des Utilisateurs
                    </span>
                    <p className="text-sm text-slate-600 font-normal mt-1">Visualisation complète des données utilisateur</p>
                  </div>
                </CardTitle>
                <div className="glass p-4 rounded-xl border-l-4 border-blue-400 mt-4">
                  <p className="text-sm text-slate-700 font-medium flex items-center gap-2">
                    <Star className="w-4 h-4 text-blue-500" />
                    📋 Vous pouvez consulter tous les utilisateurs mais ne pouvez pas modifier leurs informations.
                  </p>
                </div>
              </CardHeader>
              <CardContent className="w-full overflow-x-auto p-8">
                <div className="w-full">
                  <UsersDataTable 
                    users={users}
                    onViewUser={handleViewUser}
                    onQuickRoleChange={() => {}}
                    onQuickBanToggle={() => {}}
                    isSubAdmin={true}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deposits" className="space-y-8 w-full animate-fade-in">
            <Card className="glass border-0 shadow-2xl w-full backdrop-blur-lg hover-lift">
              <CardHeader className="bg-gradient-to-r from-emerald-50/90 to-teal-50/90 backdrop-blur-md rounded-t-xl">
                <CardTitle className="flex items-center gap-4 text-2xl">
                  <div className="p-3 bg-emerald-500 rounded-2xl text-white shadow-lg">
                    <UserPlus className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      💰 Dépôts en Lot pour Agents
                    </span>
                    <p className="text-sm text-slate-600 font-normal mt-1">Gestion automatisée des recharges agents</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8 p-8">
                <div className="flex flex-col sm:flex-row gap-6">
                  <Button
                    onClick={handleAutoBatchDeposit}
                    variant="warning"
                    size="lg"
                    disabled={!canDepositToAgent}
                    className="flex-1 h-16 text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                  >
                    <UserPlus className="w-6 h-6 mr-3" />
                    🚀 Dépôt Auto (Agents &lt; 50k)
                  </Button>
                  <Button
                    onClick={() => setShowBatchDeposit(true)}
                    variant="outline"
                    size="lg"
                    disabled={!canDepositToAgent}
                    className="flex-1 h-16 text-lg font-semibold glass border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50/80 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                  >
                    <UserPlus className="w-6 h-6 mr-3" />
                    ⚙️ Dépôt Manuel Personnalisé
                  </Button>
                </div>
                
                {showBatchDeposit && canDepositToAgent && (
                  <div className="glass p-8 rounded-2xl border-2 border-dashed border-emerald-300 animate-scale-in backdrop-blur-lg shadow-xl">
                    <BatchAgentDeposit onBack={() => setShowBatchDeposit(false)} />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de consultation des utilisateurs (lecture seule pour sous-admins) */}
        <UserManagementModal
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onUserUpdated={fetchUsers}
          isSubAdmin={true}
        />
      </div>
    </div>
  );
};

export default SubAdminDashboard;
