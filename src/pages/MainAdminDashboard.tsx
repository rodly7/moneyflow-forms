
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Plus, Minus, Percent, User, ArrowLeft, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import ProfileHeader from "@/components/dashboard/ProfileHeader";

const MainAdminDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedOperation, setSelectedOperation] = useState<'deposit' | 'withdrawal' | 'commission' | null>(null);
  const [targetPhone, setTargetPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Récupérer les utilisateurs pour les opérations
  const { data: users } = useQuery({
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
      // Trouver l'utilisateur cible
      const targetUser = users?.find(u => u.phone === targetPhone);
      
      if (!targetUser) {
        throw new Error("Utilisateur non trouvé avec ce numéro");
      }

      const operationAmount = Number(amount);
      let finalAmount = operationAmount;

      // Pour les retraits, débiter le montant (négatif)
      if (operationType === 'withdrawal') {
        finalAmount = -operationAmount;
      }

      // Effectuer l'opération sur le solde
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

      // Réinitialiser le formulaire
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
      <div className="w-full mx-auto space-y-6 px-4 py-4">
        {/* Profile Header */}
        <ProfileHeader profile={profile} />

        {/* Admin Badge */}
        <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Interface Administrateur</h2>
                  <p className="text-blue-100">Gestion des dépôts, retraits et commissions</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-200">Compte principal</p>
                <p className="text-sm font-medium">{profile.phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance Card */}
        <Card className="bg-white shadow-lg">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Wallet className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Solde administrateur</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(profile.balance, 'XAF')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        {!selectedOperation && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 bg-white border-l-4 border-l-green-500"
              onClick={() => setSelectedOperation('deposit')}
            >
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-4">
                    <Plus className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Dépôt</h3>
                  <p className="text-sm text-gray-600">Créditer un compte utilisateur</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 bg-white border-l-4 border-l-red-500"
              onClick={() => setSelectedOperation('withdrawal')}
            >
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="p-3 bg-red-100 rounded-full w-fit mx-auto mb-4">
                    <Minus className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Retrait</h3>
                  <p className="text-sm text-gray-600">Débiter un compte utilisateur</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 bg-white border-l-4 border-l-orange-500"
              onClick={() => setSelectedOperation('commission')}
            >
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="p-3 bg-orange-100 rounded-full w-fit mx-auto mb-4">
                    <Percent className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Commission</h3>
                  <p className="text-sm text-gray-600">Ajouter une commission</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Operation Form */}
        {selectedOperation && (
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  {selectedOperation === 'deposit' && <Plus className="w-5 h-5 text-green-600" />}
                  {selectedOperation === 'withdrawal' && <Minus className="w-5 h-5 text-red-600" />}
                  {selectedOperation === 'commission' && <Percent className="w-5 h-5 text-orange-600" />}
                  {selectedOperation === 'deposit' ? 'Effectuer un dépôt' : 
                   selectedOperation === 'withdrawal' ? 'Effectuer un retrait' : 'Ajouter une commission'}
                </CardTitle>
                <Button
                  onClick={() => setSelectedOperation(null)}
                  variant="ghost"
                  size="sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="targetPhone" className="text-sm font-medium text-gray-700">
                  Numéro de téléphone du destinataire
                </Label>
                <Input
                  id="targetPhone"
                  type="tel"
                  placeholder="Ex: +242061043340"
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
                  Montant (FCFA)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Entrez le montant"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-12 text-lg"
                />
              </div>

              <Button
                onClick={() => handleOperation(selectedOperation)}
                disabled={isProcessing}
                className={`w-full h-12 text-base font-semibold ${
                  selectedOperation === 'deposit' ? 'bg-green-600 hover:bg-green-700' :
                  selectedOperation === 'withdrawal' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {isProcessing ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Traitement...
                  </div>
                ) : (
                  <>
                    {selectedOperation === 'deposit' && <Plus className="w-5 h-5 mr-2" />}
                    {selectedOperation === 'withdrawal' && <Minus className="w-5 h-5 mr-2" />}
                    {selectedOperation === 'commission' && <Percent className="w-5 h-5 mr-2" />}
                    Confirmer l'opération
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Users */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <User className="w-5 h-5 text-blue-600" />
              Utilisateurs récents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {users?.slice(0, 10).map((user) => (
                <div 
                  key={user.id}
                  className="flex justify-between items-center p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setTargetPhone(user.phone)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.full_name || 'Nom non disponible'}</p>
                      <p className="text-sm text-gray-600">{user.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">
                      {formatCurrency(user.balance, 'XAF')}
                    </p>
                    <p className="text-xs text-gray-500">{user.country}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MainAdminDashboard;
