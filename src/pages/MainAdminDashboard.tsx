
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, Settings, ArrowLeft, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const MainAdminDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

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

    setIsProcessing(true);

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
    } finally {
      setIsProcessing(false);
    }
  };

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
      </div>
    </div>
  );
};

export default MainAdminDashboard;
