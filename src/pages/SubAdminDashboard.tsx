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
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-red-100 flex items-center justify-center p-6 animate-fade-in">
        <Card className="w-full max-w-lg shadow-2xl border-0 glass hover-lift animate-scale-in">
          <CardContent className="pt-10 text-center px-8">
            <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce-gentle shadow-2xl">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-6">🚫 Accès Refusé</h2>
            <p className="text-gray-700 mb-8 text-lg leading-relaxed">Cette section est exclusivement réservée aux sous-administrateurs autorisés.</p>
            <Button 
              onClick={() => navigate('/dashboard')} 
              className="w-full btn-gradient text-lg py-4 font-semibold"
              variant="default"
            >
              <ArrowLeft className="w-6 h-6 mr-3" />
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
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-rose-600/8 via-pink-600/8 to-purple-600/8"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-rose-300/25 to-pink-300/25 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-pink-300/25 to-purple-300/25 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-rose-200/15 to-pink-200/15 rounded-full blur-3xl animate-bounce-gentle"></div>
      </div>
      
      <div className="relative z-10 w-full px-6 py-8">
        {/* Enhanced Professional Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-10 gap-6 backdrop-blur-xl bg-white/40 rounded-3xl p-8 shadow-2xl border border-white/50 w-full hover:shadow-rose-500/25 hover:bg-white/45 transition-all duration-500 hover:scale-[1.01]">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="glass hover:bg-white/50 rounded-2xl text-rose-700 border-rose-300/40 border-2 backdrop-blur-md shadow-lg hover-lift"
            >
              <ArrowLeft className="w-5 h-5 mr-3" />
              <span className="font-semibold">Retour</span>
            </Button>
            <div className="w-20 h-20 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse-glow">
              <Heart className="w-10 h-10 text-white animate-bounce-gentle" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
                💖 Sous-Administration Elite
              </h1>
              <p className="text-rose-700/90 text-lg font-semibold">Centre de contrôle privilégié et raffiné</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                fetchStats();
                fetchUsers();
              }}
              disabled={isLoadingStats}
              className="hover:bg-rose-50/80 border-2 border-rose-300/50 backdrop-blur-sm bg-white/70 text-rose-700 hover:text-rose-800 shadow-xl hover:shadow-rose-500/30 transition-all duration-300 rounded-2xl font-semibold h-14 px-6"
            >
              <RefreshCw className={`w-6 h-6 ${isLoadingStats ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-3 text-base">Actualiser</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-700 hover:bg-red-50/80 border-2 border-red-300/50 backdrop-blur-sm bg-white/70 shadow-xl hover:shadow-red-500/30 transition-all duration-300 rounded-2xl font-semibold h-14 px-6"
            >
              <LogOut className="w-6 h-6" />
              <span className="hidden sm:inline ml-3 text-base">Déconnexion</span>
            </Button>
          </div>
        </div>

        {/* Enhanced Profile Section */}
        <div className="w-full mb-10">
          <Card className="bg-white/50 backdrop-blur-xl border-2 border-white/40 shadow-2xl w-full hover:shadow-rose-500/25 transition-all duration-500 overflow-hidden hover:bg-white/55 rounded-3xl">
            <CardHeader className="pb-6 bg-gradient-to-r from-rose-50/80 to-pink-50/80 backdrop-blur-md">
              <CardTitle className="flex items-center gap-4 text-rose-800 text-2xl">
                <div className="w-12 h-12 bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-2xl">👤 Profil Sous-Administrateur</span>
                  <p className="text-base text-rose-600 font-normal mt-1">Informations personnelles et accès</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <UserProfileInfo />
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Statistics Grid with Better Visibility */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 animate-slide-up">
          <Card className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white border-0 shadow-2xl hover:shadow-blue-500/50 transform hover:-translate-y-3 hover:scale-105 transition-all duration-500 overflow-hidden relative rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/25 to-purple-400/25 animate-pulse"></div>
            <div className="absolute top-6 right-6 w-28 h-28 bg-white/15 rounded-full blur-xl"></div>
            <CardContent className="p-8 relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 bg-white/25 rounded-3xl backdrop-blur-sm shadow-xl">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-bold uppercase tracking-wider">👥 UTILISATEURS</p>
                  <p className="text-4xl font-bold mt-2 drop-shadow-lg">{stats.totalUsers}</p>
                </div>
              </div>
              <div className="bg-white/15 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
                <p className="text-blue-200 text-sm font-medium">Comptes actifs dans le système</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 text-white border-0 shadow-2xl hover:shadow-emerald-500/50 transform hover:-translate-y-3 hover:scale-105 transition-all duration-500 overflow-hidden relative rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/25 to-green-400/25 animate-pulse"></div>
            <div className="absolute top-6 right-6 w-28 h-28 bg-white/15 rounded-full blur-xl"></div>
            <CardContent className="p-8 relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 bg-white/25 rounded-3xl backdrop-blur-sm shadow-xl">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-emerald-100 text-sm font-bold uppercase tracking-wider">🛡️ AGENTS</p>
                  <p className="text-4xl font-bold mt-2 drop-shadow-lg">{stats.totalAgents}</p>
                </div>
              </div>
              <div className="bg-white/15 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
                <p className="text-emerald-200 text-sm font-medium">Partenaires certifiés actifs</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-600 text-white border-0 shadow-2xl hover:shadow-purple-500/50 transform hover:-translate-y-3 hover:scale-105 transition-all duration-500 overflow-hidden relative rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/25 to-pink-400/25 animate-pulse"></div>
            <div className="absolute top-6 right-6 w-28 h-28 bg-white/15 rounded-full blur-xl"></div>
            <CardContent className="p-8 relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 bg-white/25 rounded-3xl backdrop-blur-sm shadow-xl">
                  <Activity className="w-10 h-10 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-purple-100 text-sm font-bold uppercase tracking-wider">📊 TRANSACTIONS</p>
                  <p className="text-4xl font-bold mt-2 drop-shadow-lg">{stats.totalTransactions}</p>
                </div>
              </div>
              <div className="bg-white/15 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
                <p className="text-purple-200 text-sm font-medium">Opérations totales effectuées</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-600 text-white border-0 shadow-2xl hover:shadow-orange-500/50 transform hover:-translate-y-3 hover:scale-105 transition-all duration-500 overflow-hidden relative rounded-3xl">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400/25 to-yellow-400/25 animate-pulse"></div>
            <div className="absolute top-6 right-6 w-28 h-28 bg-white/15 rounded-full blur-xl"></div>
            <CardContent className="p-8 relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 bg-white/25 rounded-3xl backdrop-blur-sm shadow-xl">
                  <DollarSign className="w-10 h-10 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-orange-100 text-sm font-bold uppercase tracking-wider">💰 SOLDE TOTAL</p>
                  <p className="text-3xl font-bold mt-2 drop-shadow-lg">{(stats.totalBalance / 1000).toFixed(0)}K XAF</p>
                </div>
              </div>
              <div className="bg-white/15 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
                <p className="text-orange-200 text-sm font-medium">Fonds disponibles système</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Main Navigation Tabs with Better Structure */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10 w-full">
          <TabsList className="grid w-full grid-cols-3 glass shadow-2xl rounded-3xl h-24 p-4 backdrop-blur-lg border-white/30 border-2">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-4 h-16 rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-2xl transition-all duration-300 font-bold text-lg data-[state=active]:text-slate-800 text-white/90"
            >
              <BarChart3 className="w-6 h-6" />
              <span>📊 Vue d'ensemble</span>
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="flex items-center gap-4 h-16 rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-2xl transition-all duration-300 font-bold text-lg data-[state=active]:text-slate-800 text-white/90"
            >
              <Eye className="w-6 h-6" />
              <span>👁️ Consultation</span>
            </TabsTrigger>
            <TabsTrigger 
              value="deposits" 
              className="flex items-center gap-4 h-16 rounded-2xl data-[state=active]:bg-white data-[state=active]:shadow-2xl transition-all duration-300 font-bold text-lg data-[state=active]:text-slate-800 text-white/90"
            >
              <UserPlus className="w-6 h-6" />
              <span>💳 Dépôts Agents</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-10 w-full animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <Card className="glass border-0 shadow-2xl w-full backdrop-blur-lg hover-lift rounded-3xl">
                <CardHeader className="bg-gradient-to-r from-blue-50/90 to-indigo-50/90 backdrop-blur-md rounded-t-3xl p-8">
                  <CardTitle className="flex items-center gap-5 text-2xl">
                    <div className="p-4 bg-blue-500 rounded-3xl text-white shadow-xl">
                      <BarChart3 className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent text-2xl">
                        📈 Statistiques Générales
                      </span>
                      <p className="text-base text-slate-600 font-normal mt-2">Résumé de l'activité système</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-3xl border-l-4 border-blue-400 shadow-lg">
                      <p className="text-base text-blue-600 font-bold">Total Utilisateurs</p>
                      <p className="text-3xl font-bold text-blue-800 mt-2">{stats.totalUsers}</p>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-3xl border-l-4 border-green-400 shadow-lg">
                      <p className="text-base text-green-600 font-bold">Total Agents</p>
                      <p className="text-3xl font-bold text-green-800 mt-2">{stats.totalAgents}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 shadow-2xl w-full backdrop-blur-lg hover-lift rounded-3xl">
                <CardHeader className="bg-gradient-to-r from-purple-50/90 to-pink-50/90 backdrop-blur-md rounded-t-3xl p-8">
                  <CardTitle className="flex items-center gap-5 text-2xl">
                    <div className="p-4 bg-purple-500 rounded-3xl text-white shadow-xl">
                      <Database className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent text-2xl">
                        💼 Permissions & Accès
                      </span>
                      <p className="text-base text-slate-600 font-normal mt-2">Vos droits d'administration</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border-2 border-green-200 shadow-md">
                      <span className="text-green-700 font-bold text-base">👁️ Consultation utilisateurs</span>
                      <span className="text-green-600 font-bold text-lg">✅ Autorisé</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border-2 border-blue-200 shadow-md">
                      <span className="text-blue-700 font-bold text-base">💳 Dépôts agents</span>
                      <span className="text-blue-600 font-bold text-lg">✅ Autorisé</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border-2 border-red-200 shadow-md">
                      <span className="text-red-700 font-bold text-base">✏️ Modification utilisateurs</span>
                      <span className="text-red-600 font-bold text-lg">❌ Interdit</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-10 w-full animate-fade-in">
            <Card className="glass border-0 shadow-2xl w-full backdrop-blur-lg hover-lift rounded-3xl">
              <CardHeader className="bg-gradient-to-r from-slate-50/90 to-gray-50/90 backdrop-blur-md rounded-t-3xl p-10">
                <CardTitle className="flex items-center gap-6 text-3xl">
                  <div className="p-5 bg-slate-600 rounded-3xl text-white shadow-2xl">
                    <Eye className="w-10 h-10" />
                  </div>
                  <div>
                    <span className="bg-gradient-to-r from-slate-700 to-gray-700 bg-clip-text text-transparent text-3xl">
                      👁️ Consultation des Utilisateurs
                    </span>
                    <p className="text-lg text-slate-600 font-normal mt-3">Visualisation complète en lecture seule</p>
                  </div>
                </CardTitle>
                <div className="glass p-8 rounded-3xl border-l-4 border-slate-400 mt-8 bg-slate-50/60 shadow-lg">
                  <div className="flex items-center gap-4">
                    <Star className="w-6 h-6 text-slate-600" />
                    <p className="text-slate-700 font-semibold text-lg">
                      📋 <strong>Mode consultation uniquement :</strong> Vous pouvez consulter tous les utilisateurs mais ne pouvez pas modifier leurs informations, rôles ou statuts.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="w-full overflow-x-auto p-10">
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

          <TabsContent value="deposits" className="space-y-10 w-full animate-fade-in">
            <Card className="glass border-0 shadow-2xl w-full backdrop-blur-lg hover-lift rounded-3xl">
              <CardHeader className="bg-gradient-to-r from-emerald-50/90 to-teal-50/90 backdrop-blur-md rounded-t-3xl p-10">
                <CardTitle className="flex items-center gap-6 text-3xl">
                  <div className="p-5 bg-emerald-600 rounded-3xl text-white shadow-2xl">
                    <UserPlus className="w-10 h-10" />
                  </div>
                  <div>
                    <span className="bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent text-3xl">
                      💰 Gestion des Dépôts Agents
                    </span>
                    <p className="text-lg text-slate-600 font-normal mt-3">Rechargement automatisé et manuel des agents</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-10 p-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-8">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-amber-500 rounded-3xl shadow-lg">
                          <Zap className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-amber-800 text-xl">🚀 Dépôt Automatique</h3>
                          <p className="text-amber-600 text-base font-medium">Recharge tous les agents &lt; 50k FCFA</p>
                        </div>
                      </div>
                      <Button
                        onClick={handleAutoBatchDeposit}
                        disabled={!canDepositToAgent}
                        className="w-full h-16 text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 rounded-2xl"
                      >
                        <UserPlus className="w-8 h-8 mr-4" />
                        Recharger Automatiquement
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-8">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-emerald-500 rounded-3xl shadow-lg">
                          <Settings className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-emerald-800 text-xl">⚙️ Dépôt Manuel</h3>
                          <p className="text-emerald-600 text-base font-medium">Configuration personnalisée</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => setShowBatchDeposit(true)}
                        variant="outline"
                        disabled={!canDepositToAgent}
                        className="w-full h-16 text-xl font-bold glass border-2 border-emerald-400 text-emerald-700 hover:bg-emerald-50/80 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 rounded-2xl"
                      >
                        <Settings className="w-8 h-8 mr-4" />
                        Configuration Manuelle
                      </Button>
                    </CardContent>
                  </Card>
                </div>
                
                {showBatchDeposit && canDepositToAgent && (
                  <div className="glass p-10 rounded-3xl border-2 border-dashed border-emerald-400 animate-scale-in backdrop-blur-lg shadow-2xl bg-emerald-50/40">
                    <BatchAgentDeposit onBack={() => setShowBatchDeposit(false)} />
                  </div>
                )}

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-3xl border-l-4 border-blue-500 shadow-lg">
                  <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-3 text-xl">
                    <Sparkles className="w-6 h-6" />
                    💡 Informations Importantes
                  </h4>
                  <ul className="space-y-3 text-blue-700 text-base">
                    <li className="flex items-start gap-3">
                      <span className="text-blue-500 mt-1 font-bold">•</span>
                      <span className="font-medium">Le dépôt automatique recharge tous les agents ayant moins de 50,000 FCFA</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-500 mt-1 font-bold">•</span>
                      <span className="font-medium">Chaque agent est rechargé à hauteur de 50,000 FCFA exactement</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-500 mt-1 font-bold">•</span>
                      <span className="font-medium">Le montant total est débité de votre solde de sous-administrateur</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-500 mt-1 font-bold">•</span>
                      <span className="font-medium">Vérifiez votre solde avant d'effectuer des dépôts en lot</span>
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
