import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Settings, LogOut, Users, UserPlus, Ban, Shield, Eye, BarChart3, CreditCard, Activity, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useSecureAdminOperations } from "@/hooks/useSecureAdminOperations";
import UsersDataTable from "@/components/admin/UsersDataTable";
import UserManagementModal from "@/components/admin/UserManagementModal";
import TransactionMonitor from "@/components/admin/TransactionMonitor";
import BatchAgentRecharge from "@/components/admin/BatchAgentRecharge";
import NotificationSender from "@/components/admin/NotificationSender";

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

const MainAdminDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { secureUpdateUserBalance, isProcessing } = useSecureAdminOperations();
  
  const [amount, setAmount] = useState("");
  const [creditPhone, setCreditPhone] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  
  // États pour la gestion des utilisateurs
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'recharge' | 'transactions' | 'batch-recharge' | 'notifications' | 'settings'>('overview');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto backdrop-blur-xl bg-white/80 shadow-2xl border border-white/50 rounded-3xl">
          <CardContent className="pt-8">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500/30 border-t-blue-500 mx-auto"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-pulse"></div>
              </div>
              <div>
                <p className="text-blue-600 font-semibold text-xl">Chargement du profil</p>
                <p className="text-gray-500">Administration en cours...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vérification admin simplifiée
  const isMainAdmin = profile.phone === '+221773637752';

  if (!isMainAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto backdrop-blur-xl bg-white/80 shadow-2xl border border-white/50 rounded-3xl">
          <CardContent className="pt-8">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-600 mb-4">Accès refusé</h2>
                <p className="text-gray-600 mb-4">Cette interface est réservée à l'administrateur principal.</p>
                <Button onClick={() => navigate('/dashboard')} className="w-full rounded-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg">
                  Retour au tableau de bord
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const handleAdminRecharge = async () => {
    if (!amount) {
      toast({
        title: "Montant requis",
        description: "Veuillez saisir un montant",
        variant: "destructive"
      });
      return;
    }

    try {
      const rechargeAmount = Number(amount);
      
      const { error: creditError } = await supabase.rpc('increment_balance', {
        user_id: user?.id,
        amount: rechargeAmount
      });

      if (creditError) {
        throw new Error("Erreur lors de la recharge automatique");
      }

      toast({
        title: "Recharge automatique effectuée",
        description: `Votre solde a été automatiquement augmenté de ${formatCurrency(rechargeAmount, 'XAF')}`,
      });

      setAmount("");

    } catch (error) {
      console.error('Erreur lors de la recharge automatique:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la recharge automatique",
        variant: "destructive"
      });
    }
  };

  const handleCreditUser = async () => {
    if (!creditPhone || !creditAmount) {
      toast({
        title: "Données manquantes",
        description: "Veuillez remplir le téléphone et le montant",
        variant: "destructive"
      });
      return;
    }

    try {
      await secureUpdateUserBalance(creditPhone, Number(creditAmount));
      setCreditPhone("");
      setCreditAmount("");
      if (activeTab === 'users') {
        fetchUsers();
      }
    } catch (error) {
      console.error('Erreur lors du crédit utilisateur:', error);
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const { data: usersData, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setUsers(usersData || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer la liste des utilisateurs",
        variant: "destructive"
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleViewUser = (user: UserData) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleQuickRoleChange = async (userId: string, newRole: 'user' | 'agent' | 'admin' | 'sub_admin') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Rôle mis à jour",
        description: `Le rôle a été changé vers ${newRole}`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Erreur lors du changement de rôle:', error);
      toast({
        title: "Erreur",
        description: "Impossible de changer le rôle",
        variant: "destructive"
      });
    }
  };

  const handleQuickBanToggle = async (userId: string, currentBanStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_banned: !currentBanStatus,
          banned_at: !currentBanStatus ? new Date().toISOString() : null,
          banned_reason: !currentBanStatus ? 'Banni par l\'administrateur' : null
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: !currentBanStatus ? "Utilisateur banni" : "Utilisateur débanni",
        description: `L'utilisateur a été ${!currentBanStatus ? 'banni' : 'débanni'} avec succès`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Erreur lors du bannissement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut de bannissement",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full mx-auto space-y-8 px-4 py-6 max-w-7xl">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between backdrop-blur-xl bg-white/80 rounded-3xl p-6 shadow-2xl border border-white/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
              <Settings className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Admin Principal</h1>
              <p className="text-blue-600 text-lg">Bienvenue, {profile.full_name}</p>
            </div>
          </div>
          <Button 
            onClick={handleSignOut} 
            variant="ghost" 
            className="text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300 rounded-full px-6 py-3 transition-all duration-300"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>

        {/* Enhanced Navigation */}
        <div className="flex gap-2 bg-white/80 backdrop-blur-xl p-3 rounded-2xl shadow-xl border border-white/50 overflow-x-auto">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('overview')}
            className="flex-shrink-0 rounded-full px-6 py-3 transition-all duration-300"
          >
            <Settings className="w-4 h-4 mr-2" />
            Vue d'ensemble
          </Button>
          <Button
            variant={activeTab === 'users' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('users')}
            className="flex-shrink-0 rounded-full px-6 py-3 transition-all duration-300"
          >
            <Users className="w-4 h-4 mr-2" />
            Utilisateurs
          </Button>
          <Button
            variant={activeTab === 'recharge' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('recharge')}
            className="flex-shrink-0 rounded-full px-6 py-3 transition-all duration-300"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Recharge
          </Button>
          <Button
            variant={activeTab === 'transactions' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('transactions')}
            className="flex-shrink-0 rounded-full px-6 py-3 transition-all duration-300"
          >
            <Activity className="w-4 h-4 mr-2" />
            Transactions
          </Button>
          <Button
            variant={activeTab === 'batch-recharge' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('batch-recharge')}
            className="flex-shrink-0 rounded-full px-6 py-3 transition-all duration-300"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Recharge Groupée
          </Button>
          <Button
            variant={activeTab === 'notifications' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('notifications')}
            className="flex-shrink-0 rounded-full px-6 py-3 transition-all duration-300"
          >
            <Send className="w-4 h-4 mr-2" />
            Notifications
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('settings')}
            className="flex-shrink-0 rounded-full px-6 py-3 transition-all duration-300"
          >
            <Shield className="w-4 h-4 mr-2" />
            Paramètres
          </Button>
        </div>

        {/* Contenu selon l'onglet actif */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Enhanced Balance Card */}
            <Card className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 text-white border-0 shadow-2xl rounded-3xl">
              <CardContent className="pt-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-blue-100">Solde Admin</h2>
                    <p className="text-3xl font-bold drop-shadow-lg">{formatCurrency(profile.balance, 'XAF')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="backdrop-blur-xl bg-white/80 shadow-xl border border-white/50 rounded-2xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="pt-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Total Utilisateurs</p>
                      <p className="text-3xl font-bold text-blue-600">{users.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="backdrop-blur-xl bg-white/80 shadow-xl border border-white/50 rounded-2xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="pt-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Agents Actifs</p>
                      <p className="text-3xl font-bold text-emerald-600">
                        {users.filter(u => u.role === 'agent').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="backdrop-blur-xl bg-white/80 shadow-xl border border-white/50 rounded-2xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="pt-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Ban className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Utilisateurs Bannis</p>
                      <p className="text-3xl font-bold text-red-600">
                        {users.filter(u => u.is_banned).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-xl bg-white/80 shadow-xl border border-white/50 rounded-2xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="pt-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Settings className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Sous-Admins</p>
                      <p className="text-3xl font-bold text-purple-600">
                        {users.filter(u => u.role === 'sub_admin').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-2xl transition-all duration-300 group backdrop-blur-xl bg-white/80 border border-white/50 rounded-2xl" onClick={() => navigate('/admin-balance-update')}>
                <CardContent className="pt-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <CreditCard className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-blue-700 mb-3 text-lg">Mise à jour des soldes</h3>
                  <p className="text-gray-600">Gestion avancée des soldes</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-2xl transition-all duration-300 group backdrop-blur-xl bg-white/80 border border-white/50 rounded-2xl" onClick={() => setActiveTab('users')}>
                <CardContent className="pt-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-emerald-700 mb-3 text-lg">Gestion Utilisateurs</h3>
                  <p className="text-gray-600">Voir et gérer tous les utilisateurs</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-2xl transition-all duration-300 group backdrop-blur-xl bg-white/80 border border-white/50 rounded-2xl" onClick={() => setActiveTab('transactions')}>
                <CardContent className="pt-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-purple-700 mb-3 text-lg">Monitoring Transactions</h3>
                  <p className="text-gray-600">Suivi en temps réel</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/90 shadow-2xl border border-white/50 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Gestion des Utilisateurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p>Chargement des utilisateurs...</p>
                  </div>
                ) : (
                  <UsersDataTable
                    users={users}
                    onViewUser={handleViewUser}
                    onQuickRoleChange={handleQuickRoleChange}
                    onQuickBanToggle={handleQuickBanToggle}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'recharge' && (
          <div className="space-y-6">
            {/* Recharge Admin */}
            <Card className="backdrop-blur-xl bg-white/90 shadow-2xl border border-white/50 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Wallet className="w-5 h-5 text-blue-600" />
                  Recharge Automatique Admin
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="rechargeAmount">Montant (FCFA)</Label>
                  <Input
                    id="rechargeAmount"
                    type="number"
                    placeholder="Montant à recharger automatiquement"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Recharge automatique:</strong> Votre solde sera automatiquement augmenté du montant saisi.
                  </p>
                </div>
                <Button
                  onClick={handleAdminRecharge}
                  disabled={isProcessing}
                  className="w-full bg-blue-600 hover:bg-blue-700 rounded-full h-12"
                >
                  {isProcessing ? "Recharge automatique..." : "Recharger Automatiquement"}
                </Button>
              </CardContent>
            </Card>

            {/* Crédit Utilisateur */}
            <Card className="backdrop-blur-xl bg-white/90 shadow-2xl border border-white/50 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <UserPlus className="w-5 h-5 text-green-600" />
                  Créditer un Utilisateur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="creditPhone">Numéro de téléphone</Label>
                  <Input
                    id="creditPhone"
                    type="text"
                    placeholder="Ex: +221773637752"
                    value={creditPhone}
                    onChange={(e) => setCreditPhone(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="creditAmount">Montant à créditer (FCFA)</Label>
                  <Input
                    id="creditAmount"
                    type="number"
                    placeholder="Montant à créditer"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                  />
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Crédit sécurisé:</strong> Le solde de l'utilisateur sera augmenté de manière sécurisée.
                  </p>
                </div>
                <Button
                  onClick={handleCreditUser}
                  disabled={isProcessing}
                  className="w-full bg-green-600 hover:bg-green-700 rounded-full h-12"
                >
                  {isProcessing ? "Crédit en cours..." : "Créditer l'Utilisateur"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'transactions' && <TransactionMonitor />}
        {activeTab === 'batch-recharge' && <BatchAgentRecharge />}
        {activeTab === 'notifications' && <NotificationSender />}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/90 shadow-2xl border border-white/50 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Paramètres Système
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Configuration et paramètres système
                  </p>
                  <p className="text-sm text-gray-500">
                    Paramètres avancés de l'application
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modal de gestion utilisateur */}
      <UserManagementModal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onUserUpdated={() => {
          fetchUsers();
          setShowUserModal(false);
          setSelectedUser(null);
        }}
      />
    </div>
  );
};

export default MainAdminDashboard;
