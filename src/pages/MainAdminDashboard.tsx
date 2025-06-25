
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Plus, Minus, Percent, User, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

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
      <div className="min-h-screen bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
        <Card className="w-full max-w-md">
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
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
      <div className="w-full mx-auto space-y-6 px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-gray-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-blue-800">Interface Administrateur</h1>
            <p className="text-blue-600">Gestion des dépôts, retraits et commissions</p>
          </div>
          <Button onClick={signOut} variant="outline" className="text-red-600 border-red-600">
            Déconnexion
          </Button>
        </div>

        {/* Solde Admin */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Wallet className="w-6 h-6 mr-3 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600">Solde administrateur</p>
                  <p className="text-2xl font-bold text-blue-800">
                    {formatCurrency(profile.balance, 'XAF')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-500">Compte principal</p>
                <p className="text-sm font-medium text-blue-700">{profile.phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Boutons d'actions */}
        {!selectedOperation && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow bg-green-50 border-green-200"
              onClick={() => setSelectedOperation('deposit')}
            >
              <CardContent className="pt-6">
                <div className="text-center">
                  <Plus className="w-12 h-12 mx-auto mb-4 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-800">Dépôt</h3>
                  <p className="text-sm text-green-600">Créditer un compte utilisateur</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow bg-red-50 border-red-200"
              onClick={() => setSelectedOperation('withdrawal')}
            >
              <CardContent className="pt-6">
                <div className="text-center">
                  <Minus className="w-12 h-12 mx-auto mb-4 text-red-600" />
                  <h3 className="text-lg font-semibold text-red-800">Retrait</h3>
                  <p className="text-sm text-red-600">Débiter un compte utilisateur</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow bg-orange-50 border-orange-200"
              onClick={() => setSelectedOperation('commission')}
            >
              <CardContent className="pt-6">
                <div className="text-center">
                  <Percent className="w-12 h-12 mx-auto mb-4 text-orange-600" />
                  <h3 className="text-lg font-semibold text-orange-800">Commission</h3>
                  <p className="text-sm text-orange-600">Ajouter une commission</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Formulaire d'opération */}
        {selectedOperation && (
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                {selectedOperation === 'deposit' && <Plus className="w-5 h-5 text-green-600" />}
                {selectedOperation === 'withdrawal' && <Minus className="w-5 h-5 text-red-600" />}
                {selectedOperation === 'commission' && <Percent className="w-5 h-5 text-orange-600" />}
                {selectedOperation === 'deposit' ? 'Effectuer un dépôt' : 
                 selectedOperation === 'withdrawal' ? 'Effectuer un retrait' : 'Ajouter une commission'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="targetPhone">Numéro de téléphone du destinataire</Label>
                <Input
                  id="targetPhone"
                  type="tel"
                  placeholder="Ex: +242061043340"
                  value={targetPhone}
                  onChange={(e) => setTargetPhone(e.target.value)}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Montant (FCFA)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Entrez le montant"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-12 text-lg"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleOperation(selectedOperation)}
                  disabled={isProcessing}
                  className={`flex-1 h-12 ${
                    selectedOperation === 'deposit' ? 'bg-green-600 hover:bg-green-700' :
                    selectedOperation === 'withdrawal' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {isProcessing ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Traitement...
                    </div>
                  ) : (
                    <>
                      {selectedOperation === 'deposit' && <Plus className="w-4 h-4 mr-2" />}
                      {selectedOperation === 'withdrawal' && <Minus className="w-4 h-4 mr-2" />}
                      {selectedOperation === 'commission' && <Percent className="w-4 h-4 mr-2" />}
                      Confirmer
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={() => setSelectedOperation(null)}
                  variant="outline"
                  className="h-12"
                  disabled={isProcessing}
                >
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Liste des utilisateurs récents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <User className="w-5 h-5" />
              Utilisateurs récents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {users?.slice(0, 10).map((user) => (
                <div 
                  key={user.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                  onClick={() => setTargetPhone(user.phone)}
                >
                  <div>
                    <p className="font-medium">{user.full_name || 'Nom non disponible'}</p>
                    <p className="text-sm text-gray-600">{user.phone}</p>
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
