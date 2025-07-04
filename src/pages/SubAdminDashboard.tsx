export { default } from './CompactSubAdminDashboard';

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
        <Card className="w-full max-w-md shadow-xl border-0 glass hover-lift">
          <CardContent className="pt-8 text-center px-6">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4">🚫 Accès Refusé</h2>
            <p className="text-gray-700 mb-6 text-sm">Cette section est exclusivement réservée aux sous-administrateurs autorisés.</p>
            <Button 
              onClick={() => navigate('/dashboard')} 
              className="w-full btn-gradient font-semibold"
              variant="default"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background élégant */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/5 via-indigo-600/5 to-purple-600/5"></div>
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-blue-300/20 to-indigo-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-indigo-300/20 to-purple-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative z-10 w-full px-4 py-6 max-w-7xl mx-auto">
        {/* En-tête propre et organisé */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4 backdrop-blur-sm bg-white/60 rounded-2xl p-6 shadow-lg border border-white/40">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="glass hover:bg-white/70 rounded-xl text-slate-700 border-slate-300/40 border"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-700 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                🛡️ Espace Sous-Administration
              </h1>
              <p className="text-slate-600 text-sm font-medium">Panneau de contrôle avancé</p>
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
              className="hover:bg-blue-50/80 border border-blue-300/50 backdrop-blur-sm bg-white/80 text-blue-700 hover:text-blue-800 shadow-md transition-all duration-300 rounded-xl font-medium px-4 py-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-2">Actualiser</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-700 hover:bg-red-50/80 border border-red-300/50 backdrop-blur-sm bg-white/80 shadow-md transition-all duration-300 rounded-xl font-medium px-4 py-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Déconnexion</span>
            </Button>
          </div>
        </div>

        {/* Section Profil condensée */}
        <div className="w-full mb-8">
          <Card className="bg-white/70 backdrop-blur-sm border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl">
            <CardHeader className="pb-4 bg-gradient-to-r from-slate-50/90 to-blue-50/90 backdrop-blur-sm rounded-t-2xl">
              <CardTitle className="flex items-center gap-3 text-slate-800 text-xl">
                <div className="w-10 h-10 bg-gradient-to-r from-slate-500 to-blue-500 rounded-xl flex items-center justify-center shadow-md">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-xl">👤 Profil Administrateur</span>
                  <p className="text-sm text-slate-600 font-normal mt-1">Informations personnelles</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <UserProfileInfo />
            </CardContent>
          </Card>
        </div>

        {/* Cartes statistiques mieux organisées */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-xs font-bold uppercase tracking-wide">UTILISATEURS</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalUsers}</p>
                </div>
              </div>
              <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-blue-200 text-xs">Comptes actifs système</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white border-0 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-emerald-100 text-xs font-bold uppercase tracking-wide">AGENTS</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalAgents}</p>
                </div>
              </div>
              <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-emerald-200 text-xs">Partenaires certifiés</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-purple-100 text-xs font-bold uppercase tracking-wide">TRANSACTIONS</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalTransactions}</p>
                </div>
              </div>
              <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-purple-200 text-xs">Opérations totales</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 text-white border-0 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-orange-100 text-xs font-bold uppercase tracking-wide">SOLDE TOTAL</p>
                  <p className="text-2xl font-bold mt-1">{(stats.totalBalance / 1000).toFixed(0)}K XAF</p>
                </div>
              </div>
              <div className="bg-white/15 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-orange-200 text-xs">Fonds système disponibles</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation par onglets optimisée */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8 w-full">
          <TabsList className="grid w-full grid-cols-3 glass shadow-lg rounded-2xl h-16 p-2 backdrop-blur-md border-white/30 border">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-3 h-12 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300 font-semibold text-base data-[state=active]:text-slate-800 text-white/90"
            >
              <BarChart3 className="w-5 h-5" />
              <span className="hidden sm:inline">Vue d'ensemble</span>
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="flex items-center gap-3 h-12 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300 font-semibold text-base data-[state=active]:text-slate-800 text-white/90"
            >
              <Eye className="w-5 h-5" />
              <span className="hidden sm:inline">Consultation</span>
            </TabsTrigger>
            <TabsTrigger 
              value="deposits" 
              className="flex items-center gap-3 h-12 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300 font-semibold text-base data-[state=active]:text-slate-800 text-white/90"
            >
              <UserPlus className="w-5 h-5" />
              <span className="hidden sm:inline">Dépôts Agents</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 w-full animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="glass border-0 shadow-lg w-full backdrop-blur-md hover-lift rounded-2xl">
                <CardHeader className="bg-gradient-to-r from-blue-50/90 to-indigo-50/90 backdrop-blur-sm rounded-t-2xl p-6">
                  <CardTitle className="flex items-center gap-4 text-xl">
                    <div className="p-3 bg-blue-500 rounded-2xl text-white shadow-md">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        📈 Statistiques Générales
                      </span>
                      <p className="text-sm text-slate-600 font-normal mt-1">Résumé de l'activité</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border-l-4 border-blue-400 shadow-sm">
                      <p className="text-sm text-blue-600 font-bold">Total Utilisateurs</p>
                      <p className="text-2xl font-bold text-blue-800 mt-1">{stats.totalUsers}</p>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-2xl border-l-4 border-green-400 shadow-sm">
                      <p className="text-sm text-green-600 font-bold">Total Agents</p>
                      <p className="text-2xl font-bold text-green-800 mt-1">{stats.totalAgents}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 shadow-lg w-full backdrop-blur-md hover-lift rounded-2xl">
                <CardHeader className="bg-gradient-to-r from-purple-50/90 to-pink-50/90 backdrop-blur-sm rounded-t-2xl p-6">
                  <CardTitle className="flex items-center gap-4 text-xl">
                    <div className="p-3 bg-purple-500 rounded-2xl text-white shadow-md">
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
                      <span className="text-green-700 font-medium text-sm">👁️ Consultation utilisateurs</span>
                      <span className="text-green-600 font-bold">✅ Autorisé</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <span className="text-blue-700 font-medium text-sm">💳 Dépôts agents</span>
                      <span className="text-blue-600 font-bold">✅ Autorisé</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-200">
                      <span className="text-red-700 font-medium text-sm">✏️ Modification utilisateurs</span>
                      <span className="text-red-600 font-bold">❌ Interdit</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-8 w-full animate-fade-in">
            <Card className="glass border-0 shadow-lg w-full backdrop-blur-md hover-lift rounded-2xl">
              <CardHeader className="bg-gradient-to-r from-slate-50/90 to-gray-50/90 backdrop-blur-sm rounded-t-2xl p-8">
                <CardTitle className="flex items-center gap-5 text-2xl">
                  <div className="p-4 bg-slate-600 rounded-2xl text-white shadow-lg">
                    <Eye className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="bg-gradient-to-r from-slate-700 to-gray-700 bg-clip-text text-transparent">
                      👁️ Consultation des Utilisateurs
                    </span>
                    <p className="text-base text-slate-600 font-normal mt-2">Visualisation complète en lecture seule</p>
                  </div>
                </CardTitle>
                <div className="glass p-6 rounded-2xl border-l-4 border-slate-400 mt-6 bg-slate-50/60 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-slate-600" />
                    <p className="text-slate-700 font-medium">
                      📋 <strong>Mode consultation uniquement :</strong> Vous pouvez consulter tous les utilisateurs mais ne pouvez pas modifier leurs informations.
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
            <Card className="glass border-0 shadow-lg w-full backdrop-blur-md hover-lift rounded-2xl">
              <CardHeader className="bg-gradient-to-r from-emerald-50/90 to-teal-50/90 backdrop-blur-sm rounded-t-2xl p-8">
                <CardTitle className="flex items-center gap-5 text-2xl">
                  <div className="p-4 bg-emerald-600 rounded-2xl text-white shadow-lg">
                    <UserPlus className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                      💰 Gestion des Dépôts Agents
                    </span>
                    <p className="text-base text-slate-600 font-normal mt-2">Rechargement automatisé et manuel</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8 p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="p-3 bg-amber-500 rounded-2xl shadow-md">
                          <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-amber-800 text-lg">🚀 Dépôt Automatique</h3>
                          <p className="text-amber-600 text-sm">Recharge agents &lt; 50k FCFA</p>
                        </div>
                      </div>
                      <Button
                        onClick={handleAutoBatchDeposit}
                        disabled={!canDepositToAgent}
                        className="w-full h-12 text-base font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 rounded-xl"
                      >
                        <UserPlus className="w-6 h-6 mr-3" />
                        Recharger Automatiquement
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="p-3 bg-emerald-500 rounded-2xl shadow-md">
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
                        className="w-full h-12 text-base font-bold glass border border-emerald-400 text-emerald-700 hover:bg-emerald-50/80 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 rounded-xl"
                      >
                        <Settings className="w-6 h-6 mr-3" />
                        Configuration Manuelle
                      </Button>
                    </CardContent>
                  </Card>
                </div>
                
                {showBatchDeposit && canDepositToAgent && (
                  <div className="glass p-8 rounded-2xl border border-dashed border-emerald-400 animate-scale-in backdrop-blur-sm shadow-md bg-emerald-50/40">
                    <BatchAgentDeposit onBack={() => setShowBatchDeposit(false)} />
                  </div>
                )}

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border-l-4 border-blue-500 shadow-sm">
                  <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2 text-lg">
                    <Sparkles className="w-5 h-5" />
                    💡 Informations Importantes
                  </h4>
                  <ul className="space-y-2 text-blue-700 text-sm">
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

        {/* Modal de consultation des utilisateurs */}
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
