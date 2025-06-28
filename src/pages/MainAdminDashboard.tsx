
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Settings, ArrowLeft, LogOut, Users, UserPlus, Ban, Shield, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useSecureAdminOperations } from "@/hooks/useSecureAdminOperations";
import UsersDataTable from "@/components/admin/UsersDataTable";
import UserManagementModal from "@/components/admin/UserManagementModal";

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
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'recharge'>('overview');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-blue-600 font-medium">Chargement du profil...</p>
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-red-600 mb-4">Accès refusé</h2>
              <p className="text-gray-600 mb-4">Cette interface est réservée à l'administrateur principal.</p>
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Retour au tableau de bord
              </Button>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 w-full">
      <div className="w-full mx-auto space-y-6 px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-700">Admin Principal</h1>
              <p className="text-blue-600">Bienvenue, {profile.full_name}</p>
            </div>
          </div>
          <Button onClick={handleSignOut} variant="ghost" className="text-red-600">
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex gap-2 bg-white p-2 rounded-lg shadow">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('overview')}
            className="flex-1"
          >
            <Settings className="w-4 h-4 mr-2" />
            Vue d'ensemble
          </Button>
          <Button
            variant={activeTab === 'users' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('users')}
            className="flex-1"
          >
            <Users className="w-4 h-4 mr-2" />
            Utilisateurs
          </Button>
          <Button
            variant={activeTab === 'recharge' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('recharge')}
            className="flex-1"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Recharge
          </Button>
        </div>

        {/* Contenu selon l'onglet actif */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Solde */}
            <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Wallet className="w-6 h-6" />
                  <div>
                    <h2 className="text-lg font-bold">Solde Admin</h2>
                    <p className="text-2xl font-bold">{formatCurrency(profile.balance, 'XAF')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistiques rapides */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Utilisateurs</p>
                      <p className="text-2xl font-bold">{users.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Shield className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Agents Actifs</p>
                      <p className="text-2xl font-bold">
                        {users.filter(u => u.role === 'agent').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Ban className="w-8 h-8 text-red-600" />
                    <div>
                      <p className="text-sm text-gray-600">Utilisateurs Bannis</p>
                      <p className="text-2xl font-bold">
                        {users.filter(u => u.is_banned).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <Card>
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
            <Card className="bg-white">
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
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isProcessing ? "Recharge automatique..." : "Recharger Automatiquement"}
                </Button>
              </CardContent>
            </Card>

            {/* Crédit Utilisateur */}
            <Card className="bg-white">
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
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? "Crédit en cours..." : "Créditer l'Utilisateur"}
                </Button>
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
