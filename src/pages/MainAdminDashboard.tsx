import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Plus, TrendingUp, Building2, ArrowLeft, Settings, User, UserCheck, Eye, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import ProfileHeader from "@/components/dashboard/ProfileHeader";
import { Badge } from "@/components/ui/badge";
import { useUserSearch } from "@/hooks/useUserSearch";
import UserManagementModal from "@/components/admin/UserManagementModal";
import UsersDataTable from "@/components/admin/UsersDataTable";

interface CommissionData {
  agent_transfer_commission: number;
  agent_withdrawal_commission: number;
  agent_total_commission: number;
  enterprise_transfer_commission: number;
  enterprise_withdrawal_commission: number;
  enterprise_total_commission: number;
}

const MainAdminDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedOperation, setSelectedOperation] = useState<'deposit' | 'recharge' | 'manage-users' | 'view-data' | null>(null);
  const [targetPhone, setTargetPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [foundUser, setFoundUser] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  const { searchUserByPhone } = useUserSearch();

  // Récupérer les utilisateurs avec les nouvelles colonnes
  const { data: users, refetch: refetchUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, is_banned, banned_reason, banned_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Récupérer les commissions calculées automatiquement
  const { data: commissions } = useQuery({
    queryKey: ['admin-commissions'],
    queryFn: async () => {
      const [transfersRes, withdrawalsRes] = await Promise.all([
        supabase.from('transfers').select('amount, created_at').eq('status', 'completed'),
        supabase.from('withdrawals').select('amount, created_at').eq('status', 'completed')
      ]);

      const transfers = transfersRes.data || [];
      const withdrawals = withdrawalsRes.data || [];

      // Calculer les commissions selon les taux définis
      const transferTotalAmount = transfers.reduce((sum, transfer) => sum + transfer.amount, 0);
      const withdrawalTotalAmount = withdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0);

      const agentTransferCommission = transferTotalAmount * 0.015; // 1,5% pour les agents
      const enterpriseTransferCommission = transferTotalAmount * 0.05; // 5% pour l'entreprise
      const agentWithdrawalCommission = withdrawalTotalAmount * 0.01; // 1% pour les agents
      const enterpriseWithdrawalCommission = withdrawalTotalAmount * 0.015; // 1,5% pour l'entreprise

      return {
        agent_transfer_commission: agentTransferCommission,
        agent_withdrawal_commission: agentWithdrawalCommission,
        agent_total_commission: agentTransferCommission + agentWithdrawalCommission,
        enterprise_transfer_commission: enterpriseTransferCommission,
        enterprise_withdrawal_commission: enterpriseWithdrawalCommission,
        enterprise_total_commission: enterpriseTransferCommission + enterpriseWithdrawalCommission,
      } as CommissionData;
    },
  });

  // Récupérer les statistiques
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [transfersRes, withdrawalsRes, rechargesRes] = await Promise.all([
        supabase.from('transfers').select('id, amount, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('withdrawals').select('id, amount, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('recharges').select('id, amount, created_at').order('created_at', { ascending: false }).limit(5)
      ]);

      return {
        transfers: transfersRes.data || [],
        withdrawals: withdrawalsRes.data || [],
        recharges: rechargesRes.data || []
      };
    },
  });

  // Recherche automatique lors de la saisie du numéro (pour les dépôts agent)
  const handlePhoneSearch = async (phoneNumber: string) => {
    setTargetPhone(phoneNumber);
    
    if (phoneNumber.length >= 8) {
      const user = await searchUserByPhone(phoneNumber);
      if (user && user.role === 'agent') {
        setFoundUser(user);
        toast({
          title: "Agent trouvé",
          description: `${user.full_name} - Solde: ${formatCurrency(user.balance, 'XAF')}`,
        });
      } else if (user && user.role !== 'agent') {
        toast({
          title: "Utilisateur non-agent",
          description: "Cette fonction est réservée aux agents uniquement",
          variant: "destructive"
        });
        setFoundUser(null);
      } else {
        setFoundUser(null);
      }
    } else {
      setFoundUser(null);
    }
  };

  // Recharge automatique du solde admin
  const handleAdminRecharge = async () => {
    if (!amount) {
      toast({
        title: "Montant requis",
        description: "Veuillez saisir un montant",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const rechargeAmount = Number(amount);
      
      // Augmenter automatiquement le solde admin
      const { error: creditError } = await supabase.rpc('increment_balance', {
        user_id: user?.id,
        amount: rechargeAmount
      });

      if (creditError) {
        throw new Error("Erreur lors de la recharge automatique");
      }

      // Créer un enregistrement de recharge
      const { error: transactionError } = await supabase
        .from('recharges')
        .insert({
          user_id: user?.id,
          amount: rechargeAmount,
          country: profile?.country || "Congo Brazzaville",
          payment_method: 'admin_auto_recharge',
          payment_phone: profile?.phone || '',
          payment_provider: 'admin',
          transaction_reference: `ADMIN-AUTO-RECHARGE-${Date.now()}`,
          status: 'completed',
          provider_transaction_id: user?.id
        });

      if (transactionError) {
        console.error('Erreur transaction:', transactionError);
      }

      toast({
        title: "Recharge automatique effectuée",
        description: `Votre solde a été automatiquement augmenté de ${formatCurrency(rechargeAmount, 'XAF')}`,
      });

      setAmount("");
      setSelectedOperation(null);

    } catch (error) {
      console.error('Erreur lors de la recharge automatique:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la recharge automatique",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Dépôt automatique pour les agents
  const handleAgentDeposit = async () => {
    if (!targetPhone || !amount) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez saisir un numéro de téléphone et un montant",
        variant: "destructive"
      });
      return;
    }

    if (!foundUser || foundUser.role !== 'agent') {
      toast({
        title: "Agent non trouvé",
        description: "Veuillez sélectionner un agent valide",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const depositAmount = Number(amount);
      
      // Débiter l'admin
      const { error: debitError } = await supabase.rpc('increment_balance', {
        user_id: user?.id,
        amount: -depositAmount
      });

      if (debitError) {
        throw new Error("Erreur lors du débit du compte admin");
      }

      // Créditer automatiquement l'agent
      const { error: creditError } = await supabase.rpc('increment_balance', {
        user_id: foundUser.id,
        amount: depositAmount
      });

      if (creditError) {
        // Annuler le débit admin en cas d'erreur
        await supabase.rpc('increment_balance', {
          user_id: user?.id,
          amount: depositAmount
        });
        throw new Error("Erreur lors du crédit du compte agent");
      }

      // Créer l'enregistrement de la transaction
      const transactionReference = `ADMIN-AGENT-DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const { error: transactionError } = await supabase
        .from('recharges')
        .insert({
          user_id: foundUser.id,
          amount: depositAmount,
          country: profile?.country || "Congo Brazzaville",
          payment_method: 'admin_agent_deposit',
          payment_phone: foundUser.phone,
          payment_provider: 'admin',
          transaction_reference: transactionReference,
          status: 'completed',
          provider_transaction_id: user?.id
        });

      if (transactionError) {
        console.error('Erreur transaction:', transactionError);
      }

      toast({
        title: "Dépôt agent effectué",
        description: `Le compte de l'agent ${foundUser.full_name} a été automatiquement rechargé de ${formatCurrency(depositAmount, 'XAF')}`,
      });

      setTargetPhone("");
      setAmount("");
      setFoundUser(null);
      setSelectedOperation(null);

    } catch (error) {
      console.error('Erreur lors du dépôt agent:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors du dépôt agent",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const promoteToAgent = async (userId: string, userPhone: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'agent' })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Promotion réussie",
        description: `L'utilisateur ${userPhone} est maintenant un agent`,
      });

      refetchUsers();
    } catch (error) {
      console.error('Erreur lors de la promotion:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la promotion de l'utilisateur",
        variant: "destructive"
      });
    }
  };

  const handleQuickRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole as 'user' | 'agent' | 'admin' | 'sub_admin' })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Rôle mis à jour",
        description: `Le rôle a été changé en ${newRole === 'sub_admin' ? 'Sous-Administrateur' : newRole === 'agent' ? 'Agent' : 'Utilisateur'}`,
      });

      refetchUsers();
    } catch (error) {
      console.error('Erreur lors du changement de rôle:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du changement de rôle",
        variant: "destructive"
      });
    }
  };

  const handleQuickBanToggle = async (userId: string, currentBanStatus: boolean) => {
    try {
      const updateData = currentBanStatus 
        ? { is_banned: false, banned_at: null, banned_reason: null }
        : { is_banned: true, banned_at: new Date().toISOString(), banned_reason: 'Bannissement rapide' };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: currentBanStatus ? "Utilisateur débanni" : "Utilisateur banni",
        description: `L'utilisateur a été ${currentBanStatus ? 'débanni' : 'banni'} avec succès`,
      });

      refetchUsers();
    } catch (error) {
      console.error('Erreur lors du bannissement:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification du statut",
        variant: "destructive"
      });
    }
  };

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleCloseUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const handleUserUpdated = () => {
    refetchUsers();
  };

  if (!profile || profile.phone !== '+221773637752') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 w-full">
      <div className="w-full mx-auto space-y-4 px-4 py-4">
        {/* Profile Header */}
        <ProfileHeader profile={profile} />

        {/* Admin Badge & Balance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Settings className="w-6 h-6" />
                <div>
                  <h2 className="text-lg font-bold">Admin Principal</h2>
                  <p className="text-xs text-blue-100">Interface de gestion</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Wallet className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-600">Solde</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(profile.balance, 'XAF')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Commissions Display */}
        {!selectedOperation && commissions && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-semibold text-emerald-800">Commission Agents</h3>
                  </div>
                  <p className="text-xl font-bold text-emerald-600">
                    {formatCurrency(commissions.agent_total_commission, 'XAF')}
                  </p>
                </div>
                <div className="mt-2 text-sm text-emerald-700">
                  <p>Transferts: {formatCurrency(commissions.agent_transfer_commission, 'XAF')}</p>
                  <p>Retraits: {formatCurrency(commissions.agent_withdrawal_commission, 'XAF')}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-800">Commission Entreprise</h3>
                  </div>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(commissions.enterprise_total_commission, 'XAF')}
                  </p>
                </div>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Transferts: {formatCurrency(commissions.enterprise_transfer_commission, 'XAF')}</p>
                  <p>Retraits: {formatCurrency(commissions.enterprise_withdrawal_commission, 'XAF')}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions - Updated */}
        {!selectedOperation && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card 
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105 bg-white border-l-4 border-l-green-500"
              onClick={() => setSelectedOperation('deposit')}
            >
              <CardContent className="pt-4 pb-4 text-center">
                <Plus className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Dépôt Agent</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105 bg-white border-l-4 border-l-blue-500"
              onClick={() => setSelectedOperation('recharge')}
            >
              <CardContent className="pt-4 pb-4 text-center">
                <Wallet className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Recharge Auto</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105 bg-white border-l-4 border-l-purple-500"
              onClick={() => setSelectedOperation('manage-users')}
            >
              <CardContent className="pt-4 pb-4 text-center">
                <UserCheck className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Gestion Avancée</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105 bg-white border-l-4 border-l-indigo-500"
              onClick={() => setSelectedOperation('view-data')}
            >
              <CardContent className="pt-4 pb-4 text-center">
                <Eye className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Données</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Admin Auto Recharge */}
        {selectedOperation === 'recharge' && (
          <Card className="bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Wallet className="w-5 h-5 text-blue-600" />
                  Recharge Automatique Admin
                </CardTitle>
                <Button onClick={() => setSelectedOperation(null)} variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>
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
        )}

        {/* Agent Deposit Form */}
        {selectedOperation === 'deposit' && (
          <Card className="bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Plus className="w-5 h-5 text-green-600" />
                  Dépôt Agent Automatique
                </CardTitle>
                <Button onClick={() => setSelectedOperation(null)} variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetPhone">Numéro de téléphone Agent</Label>
                  <Input
                    id="targetPhone"
                    type="tel"
                    placeholder="Ex: +242061043340"
                    value={targetPhone}
                    onChange={(e) => handlePhoneSearch(e.target.value)}
                  />
                  {foundUser && (
                    <div className="mt-2 p-2 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Agent: {foundUser.full_name}</strong> - Solde: {formatCurrency(foundUser.balance, 'XAF')}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="amount">Montant (FCFA)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Montant à déposer"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Dépôt automatique:</strong> Le compte de l'agent sera automatiquement rechargé du montant saisi.
                </p>
              </div>
              <Button
                onClick={handleAgentDeposit}
                disabled={isProcessing}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? "Dépôt automatique..." : "Déposer Automatiquement"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Advanced User Management */}
        {selectedOperation === 'manage-users' && (
          <Card className="bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <UserCheck className="w-5 h-5 text-purple-600" />
                  Gestion Avancée des Utilisateurs
                </CardTitle>
                <Button onClick={() => setSelectedOperation(null)} variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Fonctionnalités disponibles:</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Modifier les informations d'un utilisateur</li>
                    <li>• Changer le rôle (Utilisateur ↔ Agent ↔ Sous-Admin)</li>
                    <li>• Bannir/Débannir l'accès</li>
                    <li>• Supprimer définitivement un compte</li>
                    <li>• Voir toutes les informations détaillées</li>
                  </ul>
                </div>
                
                {users && users.length > 0 ? (
                  <UsersDataTable
                    users={users}
                    onViewUser={handleViewUser}
                    onQuickRoleChange={handleQuickRoleChange}
                    onQuickBanToggle={handleQuickBanToggle}
                  />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Aucun utilisateur trouvé</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Overview */}
        {selectedOperation === 'view-data' && (
          <Card className="bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  Aperçu des données
                </CardTitle>
                <Button onClick={() => setSelectedOperation(null)} variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Transferts récents</h3>
                  <div className="space-y-2">
                    {stats?.transfers.slice(0, 3).map((transfer) => (
                      <div key={transfer.id} className="text-sm">
                        <span className="font-medium">{formatCurrency(transfer.amount, 'XAF')}</span>
                        <span className="text-gray-600 ml-2">
                          {new Date(transfer.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">Retraits récents</h3>
                  <div className="space-y-2">
                    {stats?.withdrawals.slice(0, 3).map((withdrawal) => (
                      <div key={withdrawal.id} className="text-sm">
                        <span className="font-medium">{formatCurrency(withdrawal.amount, 'XAF')}</span>
                        <span className="text-gray-600 ml-2">
                          {new Date(withdrawal.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Recharges récentes</h3>
                  <div className="space-y-2">
                    {stats?.recharges.slice(0, 3).map((recharge) => (
                      <div key={recharge.id} className="text-sm">
                        <span className="font-medium">{formatCurrency(recharge.amount, 'XAF')}</span>
                        <span className="text-gray-600 ml-2">
                          {new Date(recharge.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Users List */}
        {!selectedOperation && (
          <Card className="bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <User className="w-5 h-5 text-blue-600" />
                Utilisateurs récents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {users?.slice(0, 5).map((user) => (
                  <div 
                    key={user.id}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                    onClick={() => setTargetPhone(user.phone)}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.full_name || 'Nom non disponible'}</p>
                        <p className="text-xs text-gray-600">{user.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-blue-600">
                        {formatCurrency(user.balance, 'XAF')}
                      </p>
                      <Badge variant={user.role === 'agent' ? 'default' : 'secondary'} className="text-xs">
                        {user.role === 'agent' ? 'Agent' : 'User'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* User Management Modal */}
      <UserManagementModal
        isOpen={showUserModal}
        onClose={handleCloseUserModal}
        user={selectedUser}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );
};

export default MainAdminDashboard;
