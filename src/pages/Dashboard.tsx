
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, QrCode, RefreshCw, LogOut, Wallet, Activity, DollarSign, History, PiggyBank, FileText, Sparkles, Crown, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import UserProfileInfo from "@/components/profile/UserProfileInfo";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import NotificationSystem from "@/components/notifications/NotificationSystem";
import { formatCurrency, getCurrencyForCountry, convertCurrency } from "@/integrations/supabase/client";
import { useBalanceCheck } from "@/hooks/useBalanceCheck";

const Dashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [balance, setBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);

  // Utiliser le hook de vérification du solde
  useBalanceCheck(balance);

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
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement de votre profil...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirection pour les autres rôles
  if (profile.role === 'agent') {
    navigate('/agent-dashboard');
    return null;
  }

  if (profile.role === 'admin') {
    navigate('/admin-dashboard');
    return null;
  }

  if (profile.role === 'sub_admin') {
    navigate('/sub-admin-dashboard');
    return null;
  }

  // Déterminer la devise basée sur le pays de l'utilisateur
  const userCurrency = getCurrencyForCountry(profile.country || "Cameroun");
  
  // Convertir le solde de XAF (devise de base) vers la devise de l'utilisateur
  const convertedBalance = convertCurrency(balance, "XAF", userCurrency);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 relative overflow-hidden">
      {/* Enhanced background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/5 via-indigo-600/5 to-cyan-600/5"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-300/20 to-indigo-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-300/20 to-blue-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-indigo-200/10 to-cyan-200/10 rounded-full blur-3xl animate-bounce-gentle"></div>
        
        {/* Floating particles */}
        <div className="absolute top-10 left-10 w-4 h-4 bg-blue-400/60 rounded-full animate-pulse"></div>
        <div className="absolute top-20 right-20 w-6 h-6 bg-cyan-400/60 rounded-full animate-pulse delay-500"></div>
        <div className="absolute bottom-20 left-20 w-5 h-5 bg-indigo-400/60 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-10 right-10 w-3 h-3 bg-blue-400/60 rounded-full animate-pulse delay-1500"></div>
      </div>
      
      <div className="relative z-10 w-full px-4 py-4 md:py-8">
        {/* Enhanced Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 backdrop-blur-xl bg-white/20 rounded-3xl p-4 md:p-6 shadow-2xl border border-white/30 w-full hover:shadow-blue-500/20 transition-all duration-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl">
              <Star className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                🌟 Espace Utilisateur
              </h1>
              <p className="text-blue-600/80 text-sm font-medium">Bienvenue dans votre tableau de bord</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationSystem />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchBalance}
              disabled={isLoadingBalance}
              className="hover:bg-blue-50 border border-blue-200 backdrop-blur-sm bg-white/50 text-blue-600 hover:text-blue-700 shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-1">Actualiser</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 backdrop-blur-sm bg-white/50 shadow-lg hover:shadow-red-500/25 transition-all duration-300"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Déconnexion</span>
            </Button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="w-full mb-6">
          <UserProfileInfo />
        </div>

        {/* Enhanced Balance Card */}
        <Card className="mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white border-0 shadow-2xl hover:shadow-blue-500/40 transform hover:-translate-y-2 hover:scale-105 transition-all duration-500 w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 animate-pulse"></div>
          <CardContent className="p-6 md:p-8 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-blue-200 animate-pulse" />
                  <p className="text-blue-100 text-sm font-medium">💰 Solde Principal</p>
                </div>
                <p className="text-3xl md:text-4xl font-bold mb-2">
                  {formatCurrency(convertedBalance, userCurrency)}
                </p>
                {userCurrency !== "XAF" && (
                  <p className="text-xs text-blue-200 font-medium">
                    Converti de {formatCurrency(balance, "XAF")}
                  </p>
                )}
              </div>
              <div className="w-16 h-16 bg-gradient-to-r from-white/20 to-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm">
                <Wallet className="w-8 h-8 text-white animate-bounce-gentle" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="w-full">
          {/* Enhanced Actions utilisateur */}
          <div className="w-full">
            {/* Actions Rapides */}
            <Card className="bg-white/30 backdrop-blur-xl border-2 border-white/20 shadow-2xl w-full hover:shadow-blue-500/20 transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-cyan-50/50"></div>
              <CardHeader className="pb-4 relative z-10">
                <CardTitle className="flex items-center gap-3 text-blue-700">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  ⚡ Actions Disponibles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <Button 
                  onClick={() => navigate('/transfer')}
                  className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-700 hover:via-indigo-700 hover:to-cyan-700 text-white font-semibold h-14 shadow-xl hover:shadow-blue-500/30 transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 rounded-2xl text-lg"
                >
                  <ArrowUpRight className="mr-3 h-6 w-6" />
                  🚀 Transférer de l'argent
                </Button>
                
                <Button 
                  onClick={() => setShowQRDialog(true)}
                  variant="outline"
                  className="w-full border-3 border-indigo-400 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-500 font-semibold h-14 shadow-lg hover:shadow-indigo-500/25 transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 rounded-2xl text-lg backdrop-blur-sm bg-white/60"
                >
                  <QrCode className="mr-3 h-6 w-6" />
                  📱 Mon QR Code (pour retrait)
                </Button>

                <Button 
                  onClick={() => navigate('/savings')}
                  variant="outline"
                  className="w-full border-3 border-emerald-400 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-500 font-semibold h-14 shadow-lg hover:shadow-emerald-500/25 transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 rounded-2xl text-lg backdrop-blur-sm bg-white/60"
                >
                  <PiggyBank className="mr-3 h-6 w-6" />
                  🏦 Mes Épargnes
                </Button>

                <Button 
                  onClick={() => navigate('/receipts')}
                  variant="outline"
                  className="w-full border-3 border-orange-400 text-orange-700 hover:bg-orange-50 hover:border-orange-500 font-semibold h-14 shadow-lg hover:shadow-orange-500/25 transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 rounded-2xl text-lg backdrop-blur-sm bg-white/60"
                >
                  <FileText className="mr-3 h-6 w-6" />
                  📄 Mes Reçus
                </Button>
                
                <Button 
                  onClick={() => navigate('/transactions')}
                  variant="outline"
                  className="w-full border-3 border-purple-400 text-purple-700 hover:bg-purple-50 hover:border-purple-500 font-semibold h-14 shadow-lg hover:shadow-purple-500/25 transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 rounded-2xl text-lg backdrop-blur-sm bg-white/60"
                >
                  <History className="mr-3 h-6 w-6" />
                  📊 Historique des transactions
                </Button>
              </CardContent>
            </Card>

            {/* Enhanced Information importante */}
            <Card className="mt-6 bg-gradient-to-r from-blue-50/80 via-indigo-50/80 to-cyan-50/80 border-l-8 border-blue-500 backdrop-blur-xl shadow-xl w-full hover:shadow-blue-500/20 transition-all duration-500">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-blue-800 text-lg">💡 Informations importantes</h3>
                </div>
                <div className="space-y-3 text-sm text-blue-700 font-medium">
                  <div className="flex items-start gap-3 p-3 bg-white/50 rounded-xl backdrop-blur-sm">
                    <span className="text-lg">📱</span>
                    <p>Pour effectuer un retrait, vous devez présenter votre QR Code à un agent</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white/50 rounded-xl backdrop-blur-sm">
                    <span className="text-lg">⚡</span>
                    <p>Vos transferts sont traités instantanément</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white/50 rounded-xl backdrop-blur-sm">
                    <span className="text-lg">🔔</span>
                    <p>Consultez régulièrement vos notifications pour les mises à jour</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white/50 rounded-xl backdrop-blur-sm">
                    <span className="text-lg">📄</span>
                    <p>Téléchargez vos reçus depuis la section "Mes Reçus"</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white/50 rounded-xl backdrop-blur-sm">
                    <span className="text-lg">🏦</span>
                    <p>Créez des comptes d'épargne pour atteindre vos objectifs financiers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <QRCodeGenerator 
        isOpen={showQRDialog}
        onClose={() => setShowQRDialog(false)}
      />
    </div>
  );
};

export default Dashboard;
