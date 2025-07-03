
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, TrendingUp, Shield, LogOut, RefreshCw, DollarSign, Activity, UserPlus, Star, Sparkles, Heart, Gem, Zap, Eye, Settings, BarChart3, Database } from "lucide-react";
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
    <div className="min-h-screen w-full bg-gradient-to-br from-rose-50 via-pink-50 to-purple-100 relative overflow-hidden animate-fade-in">
      {/* Enhanced elegant background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-rose-600/5 via-pink-600/5 to-purple-600/5"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-rose-300/20 to-pink-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-pink-300/20 to-purple-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-rose-200/10 to-pink-200/10 rounded-full blur-3xl animate-bounce-gentle"></div>
      </div>
      
      <div className="relative z-10 w-full px-4 py-6 md:py-8">
        {/* Enhanced Professional Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 backdrop-blur-xl bg-white/30 rounded-3xl p-6 md:p-8 shadow-2xl border border-white/40 w-full hover:shadow-rose-500/20 hover:bg-white/35 transition-all duration-500 hover:scale-[1.01]">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="glass hover:bg-white/40 rounded-2xl text-rose-700 border-rose-300/30 border backdrop-blur-md shadow-lg hover-lift mr-2"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="font-medium">Retour</span>
            </Button>
            <div className="w-16 h-16 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse-glow">
              <Heart className="w-8 h-8 text-white animate-bounce-gentle" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                💖 Sous-Administration Elite
              </h1>
              <p className="text-rose-700/90 text-base font-semibold">Centre de contrôle privilégié et raffiné</p>
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
              className="hover:bg-rose-50/80 border-2 border-rose-300/50 backdrop-blur-sm bg-white/60 text-rose-700 hover:text-rose-800 shadow-xl hover:shadow-rose-500/30 transition-all duration-300 rounded-2xl font-medium h-12 px-4"
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

        {/* Enhanced Profile Section */}
        <div className="w-full mb-8">
          <Card className="bg-white/40 backdrop-blur-xl border-2 border-white/30 shadow-2xl w-full hover:shadow-rose-500/20 transition-all duration-500 overflow-hidden hover:bg-white/45 rounded-3xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-rose-800 text-xl">
                <div className="w-10 h-10 bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                👤 Profil Sous-Administrateur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UserProfileInfo />
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-10 animate-slide-up">
          <Card className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white border-0 shadow-2xl hover:shadow-blue-500/40 transform hover:-translate-y-2 hover:scale-105 transition-all duration-500 overflow-hidden relative rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse"></div>
            <div className="absolute top-4 right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-semibold uppercase tracking-wide">👥 Utilisateurs</p>
                  <p className="text-3xl font-bold mt-1 drop-shadow-lg">{stats.totalUsers}</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-blue-200 text-xs">Comptes actifs dans le système</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 text-white border-0 shadow-2xl hover:shadow-emerald-500/40 transform hover:-translate-y-2 hover:scale-105 transition-all duration-500 overflow-hidden relative rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-green-400/20 animate-pulse"></div>
            <div className="absolute top-4 right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-emerald-100 text-sm font-semibold uppercase tracking-wide">🛡️ Agents</p>
                  <p className="text-3xl font-bold mt-1 drop-shadow-lg">{stats.totalAgents}</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-emerald-200 text-xs">Partenaires certifiés actifs</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-600 text-white border-0 shadow-2xl hover:shadow-purple-500/40 transform hover:-translate-y-2 hover:scale-105 transition-all duration-500 overflow-hidden relative rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 animate-pulse"></div>
            <div className="absolute top-4 right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-purple-100 text-sm font-semibold uppercase tracking-wide">📊 Transactions</p>
                  <p className="text-3xl font-bold mt-1 drop-shadow-lg">{stats.totalTransactions}</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-purple-200 text-xs">Opérations totales effectuées</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-600 text-white border-0 shadow-2xl hover:shadow-orange-500/40 transform hover:-translate-y-2 hover:scale-105 transition-all duration-500 overflow-hidden relative rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-yellow-400/20 animate-pulse"></div>
            <div className="absolute top-4 right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shadow-lg">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-orange-100 text-sm font-semibold uppercase tracking-wide">💰 Solde Total</p>
                  <p className="text-2xl font-bold mt-1 drop-shadow-lg">{(stats.totalBalance / 1000).toFixed(0)}K XAF</p>
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-orange-200 text-xs">Fonds disponibles système</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8 w-full">
          <TabsList className="grid w-full grid-cols-3 glass shadow-2xl rounded-3xl h-20 p-3 backdrop-blur-lg border-white/20 border">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-3 h-14 rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-xl transition-all duration-300 font-semibold text-base data-[state=active]:text-slate-800 text-white/80"
            >
              <BarChart3 className="w-5 h-5" />
              <span>📊 Vue d'ensemble</span>
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="flex items-center gap-3 h-14 rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-xl transition-all duration-300 font-semibold text-base data-[state=active]:text-slate-800 text-white/80"
            >
              <Eye className="w-5 h-5" />
              <span>👁️ Consultation</span>
            </TabsTrigger>
            <TabsTrigger 
              value="deposits" 
              className="flex items-center gap-3 h-14 rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-xl transition-all duration-300 font-semibold text-base data-[state=active]:text-slate-800 text-white/80"
            >
              <UserPlus className="w-5 h-5" />
              <span>💳 Dépôts Agents</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 w-full animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="glass border-0 shadow-2xl w-full backdrop-blur-lg hover-lift rounded-3xl">
                <CardHeader className="bg-gradient-to-r from-blue-50/90 to-indigo-50/90 backdrop-blur-md rounded-t-3xl">
                  <CardTitle className="flex items-center gap-4 text-xl">
                    <div className="p-3 bg-blue-500 rounded-2xl text-white shadow-lg">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        📈 Statistiques Générales
                      </span>
                      <p className="text-sm text-slate-600 font-normal mt-1">Résumé de l'activité système</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border-l-4 border-blue-400">
                      <p className="text-sm text-blue-600 font-medium">Total Utilisateurs</p>
                      <p className="text-2xl font-bold text-blue-800">{stats.totalUsers}</p>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-2xl border-l-4 border-green-400">
                      <p className="text-sm text-green-600 font-medium">Total Agents</p>
                      <p className="text-2xl font-bold text-green-800">{stats.totalAgents}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 shadow-2xl w-full backdrop-blur-lg hover-lift rounded-3xl">
                <CardHeader className="bg-gradient-to-r from-purple-50/90 to-pink-50/90 backdrop-blur-md rounded-t-3xl">
                  <CardTitle className="flex items-center gap-4 text-xl">
                    <div className="p-3 bg-purple-500 rounded-2xl text-white shadow-lg">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        💼 Permissions & Accès
                      </span>
                      <p className="text-sm text-slate-600 font-normal mt-1">Vos droits d'administration</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                      <span className="text-green-700 font-medium">👁️ Consultation utilisateurs</span>
                      <span className="text-green-600 font-bold">✅ Autorisé</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <span className="text-blue-700 font-medium">💳 Dépôts agents</span>
                      <span className="text-blue-600 font-bold">✅ Autorisé</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-200">
                      <span className="text-red-700 font-medium">✏️ Modification utilisateurs</span>
                      <span className="text-red-600 font-bold">❌ Interdit</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-8 w-full animate-fade-in">
            <Card className="glass border-0 shadow-2xl w-full backdrop-blur-lg hover-lift rounded-3xl">
              <CardHeader className="bg-gradient-to-r from-slate-50/90 to-gray-50/90 backdrop-blur-md rounded-t-3xl p-8">
                <CardTitle className="flex items-center gap-4 text-2xl">
                  <div className="p-4 bg-slate-600 rounded-3xl text-white shadow-xl">
                    <Eye className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="bg-gradient-to-r from-slate-700 to-gray-700 bg-clip-text text-transparent">
                      👁️ Consultation des Utilisateurs
                    </span>
                    <p className="text-base text-slate-600 font-normal mt-2">Visualisation complète en lecture seule</p>
                  </div>
                </CardTitle>
                <div className="glass p-6 rounded-2xl border-l-4 border-slate-400 mt-6 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-slate-600" />
                    <p className="text-slate-700 font-medium">
                      📋 <strong>Mode consultation uniquement :</strong> Vous pouvez consulter tous les utilisateurs mais ne pouvez pas modifier leurs informations, rôles ou statuts.
                    </p>
                  </div>
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
            <Card className="glass border-0 shadow-2xl w-full backdrop-blur-lg hover-lift rounded-3xl">
              <CardHeader className="bg-gradient-to-r from-emerald-50/90 to-teal-50/90 backdrop-blur-md rounded-t-3xl p-8">
                <CardTitle className="flex items-center gap-4 text-2xl">
                  <div className="p-4 bg-emerald-600 rounded-3xl text-white shadow-xl">
                    <UserPlus className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                      💰 Gestion des Dépôts Agents
                    </span>
                    <p className="text-base text-slate-600 font-normal mt-2">Rechargement automatisé et manuel des agents</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8 p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-amber-500 rounded-2xl">
                          <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-amber-800 text-lg">🚀 Dépôt Automatique</h3>
                          <p className="text-amber-600 text-sm">Recharge tous les agents &lt; 50k FCFA</p>
                        </div>
                      </div>
                      <Button
                        onClick={handleAutoBatchDeposit}
                        disabled={!canDepositToAgent}
                        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 rounded-xl"
                      >
                        <UserPlus className="w-6 h-6 mr-3" />
                        Recharger Automatiquement
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-emerald-500 rounded-2xl">
                          <Settings className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-emerald-800 text-lg">⚙️ Dépôt Manuel</h3>
                          <p className="text-emerald-600 text-sm">Configuration personnalisée</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => setShowBatchDeposit(true)}
                        variant="outline"
                        disabled={!canDepositToAgent}
                        className="w-full h-14 text-lg font-semibold glass border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50/80 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 rounded-xl"
                      >
                        <Settings className="w-6 h-6 mr-3" />
                        Configuration Manuelle
                      </Button>
                    </CardContent>
                  </Card>
                </div>
                
                {showBatchDeposit && canDepositToAgent && (
                  <div className="glass p-8 rounded-3xl border-2 border-dashed border-emerald-300 animate-scale-in backdrop-blur-lg shadow-2xl bg-emerald-50/30">
                    <BatchAgentDeposit onBack={() => setShowBatchDeposit(false)} />
                  </div>
                )}

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border-l-4 border-blue-400">
                  <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    💡 Informations Importantes
                  </h4>
                  <ul className="space-y-2 text-blue-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>Le dépôt automatique recharge tous les agents ayant moins de 50,000 FCFA</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>Chaque agent est rechargé à hauteur de 50,000 FCFA exactement</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>Le montant total est débité de votre solde de sous-administrateur</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>Vérifiez votre solde avant d'effectuer des dépôts en lot</span>
                    </li>
                  </ul>
                </div>
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
