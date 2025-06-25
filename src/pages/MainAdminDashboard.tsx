
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Plus, Minus, Percent, User, ArrowLeft, Settings, Eye, UserCheck, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import ProfileHeader from "@/components/dashboard/ProfileHeader";
import { Badge } from "@/components/ui/badge";

const MainAdminDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedOperation, setSelectedOperation] = useState<'deposit' | 'withdrawal' | 'commission' | 'manage-users' | 'view-data' | null>(null);
  const [targetPhone, setTargetPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleOperation = async (operationType: 'deposit' | 'withdrawal' | 'commission') => {
    if (!targetPhone || !amount) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez saisir un numéro de téléphone et un montant",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const targetUser = users?.find(u => u.phone === targetPhone);
      
      if (!targetUser) {
        throw new Error("Utilisateur non trouvé avec ce numéro");
      }

      const operationAmount = Number(amount);
      let finalAmount = operationAmount;

      if (operationType === 'withdrawal') {
        finalAmount = -operationAmount;
      }

      const { error: balanceError } = await supabase.rpc('increment_balance', {
        user_id: targetUser.id,
        amount: finalAmount
      });

      if (balanceError) {
        throw new Error("Erreur lors de la mise à jour du solde");
      }

      // Créer un enregistrement selon le type d'opération
      if (operationType === 'deposit') {
        await supabase.from('recharges').insert({
          user_id: targetUser.id,
          amount: operationAmount,
          country: targetUser.country || "Congo Brazzaville",
          payment_method: 'admin_credit',
          payment_phone: targetPhone,
          payment_provider: 'admin',
          transaction_reference: `ADMIN-${Date.now()}`,
          status: 'completed',
          provider_transaction_id: user?.id
        });
      } else if (operationType === 'withdrawal') {
        await supabase.from('withdrawals').insert({
          user_id: targetUser.id,
          amount: operationAmount,
          withdrawal_phone: targetPhone,
          status: 'completed'
        });
      }

      toast({
        title: "Opération réussie",
        description: `${operationType === 'deposit' ? 'Dépôt' : operationType === 'withdrawal' ? 'Retrait' : 'Commission'} de ${formatCurrency(operationAmount, 'XAF')} effectué pour ${targetUser.full_name}`,
      });

      setTargetPhone("");
      setAmount("");
      setSelectedOperation(null);

    } catch (error) {
      console.error('Erreur lors de l\'opération:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'opération",
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

        {/* Admin Badge & Balance - Compact */}
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

        {/* Quick Actions - Compact */}
        {!selectedOperation && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105 bg-white border-l-4 border-l-orange-500"
              onClick={() => setSelectedOperation('commission')}
            >
              <CardContent className="pt-4 pb-4 text-center">
                <Percent className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Commission</p>
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

        {/* Operation Forms */}
        {(selectedOperation === 'deposit' || selectedOperation === 'withdrawal' || selectedOperation === 'commission') && (
          <Card className="bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  {selectedOperation === 'deposit' && <Plus className="w-5 h-5 text-green-600" />}
                  {selectedOperation === 'withdrawal' && <Minus className="w-5 h-5 text-red-600" />}
                  {selectedOperation === 'commission' && <Percent className="w-5 h-5 text-orange-600" />}
                  {selectedOperation === 'deposit' ? 'Dépôt' : 
                   selectedOperation === 'withdrawal' ? 'Retrait' : 'Commission'}
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
                    onChange={(e) => setTargetPhone(e.target.value)}
                  />
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
              <Button
                onClick={() => handleOperation(selectedOperation)}
                disabled={isProcessing}
                className={`w-full ${
                  selectedOperation === 'deposit' ? 'bg-green-600 hover:bg-green-700' :
                  selectedOperation === 'withdrawal' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {isProcessing ? "Traitement..." : "Confirmer"}
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

        {/* Quick Users List - Only when no operation selected */}
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
