
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Plus, Minus, Search, TrendingUp, Building2, ArrowLeft, Settings, User, UserCheck, Eye, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import ProfileHeader from "@/components/dashboard/ProfileHeader";
import { Badge } from "@/components/ui/badge";
import { useSecureDepositWithdrawalOperations } from "@/hooks/useSecureDepositWithdrawalOperations";
import { useUserSearch } from "@/hooks/useUserSearch";

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
  const [selectedOperation, setSelectedOperation] = useState<'deposit' | 'withdrawal' | 'recharge' | 'manage-users' | 'view-data' | 'balance-search' | null>(null);
  const [targetPhone, setTargetPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchPhone, setSearchPhone] = useState("");
  const [searchedUser, setSearchedUser] = useState<any>(null);
  const [foundUser, setFoundUser] = useState<any>(null);

  const { processSecureDeposit, processSecureWithdrawal } = useSecureDepositWithdrawalOperations();
  const { searchUserByPhone, isSearching } = useUserSearch();

  // Récupérer les utilisateurs
  const { data: users, refetch: refetchUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
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

  // Recherche automatique lors de la saisie du numéro
  const handlePhoneSearch = async (phoneNumber: string) => {
    setTargetPhone(phoneNumber);
    
    if (phoneNumber.length >= 8) {
      const user = await searchUserByPhone(phoneNumber);
      if (user) {
        setFoundUser(user);
        toast({
          title: "Utilisateur trouvé",
          description: `${user.full_name} - Solde: ${formatCurrency(user.balance, 'XAF')}`,
        });
      } else {
        setFoundUser(null);
      }
    } else {
      setFoundUser(null);
    }
  };

  // Rechercher un utilisateur par téléphone (pour l'onglet recherche)
  const handleSearchUser = async () => {
    if (!searchPhone) {
      toast({
        title: "Numéro requis",
        description: "Veuillez saisir un numéro de téléphone",
        variant: "destructive"
      });
      return;
    }

    const user = await searchUserByPhone(searchPhone);
    if (user) {
      setSearchedUser(user);
      toast({
        title: "Utilisateur trouvé",
        description: `${user.full_name} - Solde: ${formatCurrency(user.balance, 'XAF')}`,
      });
    } else {
      toast({
        title: "Utilisateur non trouvé",
        description: "Aucun utilisateur trouvé avec ce numéro",
        variant: "destructive"
      });
      setSearchedUser(null);
    }
  };

  // Recharger le solde admin
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
      
      const { error: creditError } = await supabase.rpc('increment_balance', {
        user_id: user?.id,
        amount: rechargeAmount
      });

      if (creditError) {
        throw new Error("Erreur lors de la recharge");
      }

      // Créer un enregistrement de recharge
      const { error: transactionError } = await supabase
        .from('recharges')
        .insert({
          user_id: user?.id,
          amount: rechargeAmount,
          country: profile?.country || "Congo Brazzaville",
          payment_method: 'admin_recharge',
          payment_phone: profile?.phone || '',
          payment_provider: 'admin',
          transaction_reference: `ADMIN-RECHARGE-${Date.now()}`,
          status: 'completed',
          provider_transaction_id: user?.id
        });

      if (transactionError) {
        console.error('Erreur transaction:', transactionError);
      }

      toast({
        title: "Recharge effectuée",
        description: `Votre solde a été rechargé de ${formatCurrency(rechargeAmount, 'XAF')}`,
      });

      setAmount("");
      setSelectedOperation(null);

    } catch (error) {
      console.error('Erreur lors de la recharge:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la recharge",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Gérer les opérations de dépôt et retrait avec le système des agents
  const handleSecureOperation = async (operationType: 'deposit' | 'withdrawal') => {
    if (!targetPhone || !amount) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez saisir un numéro de téléphone et un montant",
        variant: "destructive"
      });
      return;
    }

    const targetUser = foundUser || users?.find(u => u.phone === targetPhone);
    if (!targetUser) {
      toast({
        title: "Utilisateur non trouvé",
        description: "Aucun utilisateur trouvé avec ce numéro",
        variant: "destructive"
      });
      return;
    }

    const operationAmount = Number(amount);
    let success = false;

    if (operationType === 'deposit') {
      success = await processSecureDeposit(operationAmount, targetUser.id, targetUser.full_name, targetUser.phone);
    } else {
      success = await processSecureWithdrawal(operationAmount, targetUser.id, targetUser.full_name, targetUser.phone);
    }

    if (success) {
      setTargetPhone("");
      setAmount("");
      setFoundUser(null);
      setSelectedOperation(null);
      refetchUsers();
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

        {/* Quick Actions */}
        {!selectedOperation && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Card 
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105 bg-white border-l-4 border-l-green-500"
              onClick={() => setSelectedOperation('deposit')}
            >
              <CardContent className="pt-4 pb-4 text-center">
                <Plus className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Dépôt</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105 bg-white border-l-4 border-l-red-500"
              onClick={() => setSelectedOperation('withdrawal')}
            >
              <CardContent className="pt-4 pb-4 text-center">
                <Minus className="w-6 h-6 text-red-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Retrait</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105 bg-white border-l-4 border-l-blue-500"
              onClick={() => setSelectedOperation('recharge')}
            >
              <CardContent className="pt-4 pb-4 text-center">
                <Wallet className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Recharge</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105 bg-white border-l-4 border-l-orange-500"
              onClick={() => setSelectedOperation('balance-search')}
            >
              <CardContent className="pt-4 pb-4 text-center">
                <Search className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Recherche</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105 bg-white border-l-4 border-l-purple-500"
              onClick={() => setSelectedOperation('manage-users')}
            >
              <CardContent className="pt-4 pb-4 text-center">
                <UserCheck className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Gestion</p>
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

        {/* Balance Search */}
        {selectedOperation === 'balance-search' && (
          <Card className="bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Search className="w-5 h-5 text-orange-600" />
                  Recherche de solde
                </CardTitle>
                <Button onClick={() => setSelectedOperation(null)} variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="searchPhone">Numéro de téléphone</Label>
                  <Input
                    id="searchPhone"
                    type="tel"
                    placeholder="Ex: +242061043340"
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                  />
                </div>
                <Button onClick={handleSearchUser} className="mt-6 bg-orange-600 hover:bg-orange-700" disabled={isSearching}>
                  <Search className="w-4 h-4 mr-2" />
                  {isSearching ? "Recherche..." : "Rechercher"}
                </Button>
              </div>
              
              {searchedUser && (
                <Card className="bg-gray-50">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="w-8 h-8 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">{searchedUser.full_name || 'Nom non disponible'}</p>
                          <p className="text-sm text-gray-600">{searchedUser.phone}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-blue-600">
                          {formatCurrency(searchedUser.balance, 'XAF')}
                        </p>
                        <Badge variant={searchedUser.role === 'agent' ? 'default' : 'secondary'}>
                          {searchedUser.role === 'agent' ? 'Agent' : 'Utilisateur'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        )}

        {/* Admin Recharge */}
        {selectedOperation === 'recharge' && (
          <Card className="bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Wallet className="w-5 h-5 text-blue-600" />
                  Recharge Admin
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
                  placeholder="Montant à recharger"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Recharge administrative:</strong> Cette opération permet de recharger votre solde administrateur.
                </p>
              </div>
              <Button
                onClick={handleAdminRecharge}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? "Traitement..." : "Confirmer Recharge"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Operation Forms - Using Agent System */}
        {(selectedOperation === 'deposit' || selectedOperation === 'withdrawal') && (
          <Card className="bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  {selectedOperation === 'deposit' && <Plus className="w-5 h-5 text-green-600" />}
                  {selectedOperation === 'withdrawal' && <Minus className="w-5 h-5 text-red-600" />}
                  {selectedOperation === 'deposit' ? 'Dépôt Sécurisé' : 'Retrait Sécurisé'}
                </CardTitle>
                <Button onClick={() => setSelectedOperation(null)} variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetPhone">Numéro de téléphone</Label>
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
                        <strong>{foundUser.full_name}</strong> - Solde: {formatCurrency(foundUser.balance, 'XAF')}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="amount">Montant (FCFA)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Montant"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Système sécurisé:</strong> Cette opération utilise le même système que les agents avec toutes les vérifications de sécurité.
                </p>
              </div>
              <Button
                onClick={() => handleSecureOperation(selectedOperation)}
                disabled={isProcessing}
                className={`w-full ${
                  selectedOperation === 'deposit' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isProcessing ? "Traitement sécurisé..." : `Confirmer ${selectedOperation === 'deposit' ? 'Dépôt' : 'Retrait'}`}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* User Management */}
        {selectedOperation === 'manage-users' && (
          <Card className="bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <UserCheck className="w-5 h-5 text-purple-600" />
                  Gestion des utilisateurs
                </CardTitle>
                <Button onClick={() => setSelectedOperation(null)} variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {users?.map((user) => (
                  <div key={user.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <User className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">{user.full_name || 'Nom non disponible'}</p>
                        <p className="text-sm text-gray-600">{user.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={user.role === 'agent' ? 'default' : 'secondary'}>
                        {user.role === 'agent' ? 'Agent' : 'Utilisateur'}
                      </Badge>
                      <p className="text-sm font-semibold text-blue-600">
                        {formatCurrency(user.balance, 'XAF')}
                      </p>
                      {user.role === 'user' && (
                        <Button
                          size="sm"
                          onClick={() => promoteToAgent(user.id, user.phone)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          Promouvoir Agent
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
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
    </div>
  );
};

export default MainAdminDashboard;
