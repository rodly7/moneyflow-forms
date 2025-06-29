
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, ArrowDownLeft, Plus, QrCode, CreditCard, Receipt, RefreshCw, LogOut, Wallet, User, Bell, TrendingUp, Activity, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import BalanceCard from "@/components/dashboard/BalanceCard";
import TransactionsCard from "@/components/dashboard/TransactionsCard";
import ProfileHeader from "@/components/dashboard/ProfileHeader";
import ActionButtons from "@/components/dashboard/ActionButtons";

const Dashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [balance, setBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const fetchBalance = async () => {
    if (user?.id) {
      setIsLoadingBalance(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        setBalance(data.balance || 0);
      } catch (error) {
        console.error("Erreur lors du chargement du solde:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger votre solde",
          variant: "destructive"
        });
      }
      setIsLoadingBalance(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [user]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement de votre profil...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 md:w-64 md:h-64 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 md:w-96 md:h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-4 md:py-8 max-w-6xl">
        {/* Enhanced Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 backdrop-blur-sm bg-white/70 rounded-2xl p-4 md:p-6 shadow-lg border border-white/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Tableau de bord
              </h1>
              <p className="text-sm text-gray-600 hidden sm:block">
                Bienvenue, {profile.full_name || 'Utilisateur'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchBalance}
              disabled={isLoadingBalance}
              className="hover:bg-green-50 border border-green-200"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-1">Actualiser</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Déconnexion</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-xl">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Solde Principal</p>
                  <p className="text-2xl md:text-3xl font-bold">{balance.toLocaleString()} XAF</p>
                </div>
                <Wallet className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-emerald-600 to-green-600 text-white border-0 shadow-xl">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Pays</p>
                  <p className="text-lg md:text-xl font-bold">{profile.country}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-xl">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Statut</p>
                  <p className="text-lg md:text-xl font-bold">Actif</p>
                </div>
                <Activity className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-600 to-red-600 text-white border-0 shadow-xl">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Notifications</p>
                  <p className="text-2xl md:text-3xl font-bold">0</p>
                </div>
                <Bell className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Actions rapides */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <DollarSign className="w-5 h-5" />
                  Actions Rapides
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => navigate('/transfer')}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold h-12 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <ArrowUpRight className="mr-2 h-5 w-5" />
                  Envoyer de l'argent
                </Button>
                
                <Button 
                  onClick={() => navigate('/receive')}
                  variant="outline"
                  className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-semibold h-12 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <ArrowDownLeft className="mr-2 h-5 w-5" />
                  Recevoir de l'argent
                </Button>
                
                <Button 
                  onClick={() => navigate('/qr-code')}
                  variant="outline"
                  className="w-full border-2 border-purple-500 text-purple-600 hover:bg-purple-50 font-semibold h-12 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <QrCode className="mr-2 h-5 w-5" />
                  Mon QR Code
                </Button>
                
                <Button 
                  onClick={() => navigate('/withdraw')}
                  variant="outline"
                  className="w-full border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold h-12 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <ArrowDownLeft className="mr-2 h-5 w-5" />
                  Retirer
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Transactions récentes */}
          <div className="lg:col-span-2">
            <TransactionsCard />
          </div>
        </div>

        {/* Services additionnels */}
        <div className="mt-6">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-blue-600">Services Additionnels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <Button 
                  onClick={() => navigate('/bill-payments')}
                  variant="ghost"
                  className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-blue-50"
                >
                  <Receipt className="w-6 h-6 text-blue-600" />
                  <span className="text-xs text-center">Paiement Factures</span>
                </Button>
                
                <Button 
                  onClick={() => navigate('/prepaid-cards')}
                  variant="ghost"
                  className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-green-50"
                >
                  <CreditCard className="w-6 h-6 text-green-600" />
                  <span className="text-xs text-center">Cartes Prépayées</span>
                </Button>
                
                <Button 
                  onClick={() => navigate('/transactions')}
                  variant="ghost"
                  className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-purple-50"
                >
                  <Activity className="w-6 h-6 text-purple-600" />
                  <span className="text-xs text-center">Historique</span>
                </Button>
                
                <Button 
                  onClick={() => navigate('/verify-identity')}
                  variant="ghost"
                  className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-orange-50"
                >
                  <User className="w-6 h-6 text-orange-600" />
                  <span className="text-xs text-center">Vérifier Identité</span>
                </Button>
                
                <Button 
                  onClick={() => navigate('/commission')}
                  variant="ghost"
                  className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-red-50"
                >
                  <DollarSign className="w-6 h-6 text-red-600" />
                  <span className="text-xs text-center">Commissions</span>
                </Button>
                
                <Button 
                  onClick={() => navigate('/qr-code')}
                  variant="ghost"
                  className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-indigo-50"
                >
                  <QrCode className="w-6 h-6 text-indigo-600" />
                  <span className="text-xs text-center">QR Code</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
