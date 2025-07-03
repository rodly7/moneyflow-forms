
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, QrCode, RefreshCw, LogOut, Wallet, Activity, DollarSign, History, PiggyBank, FileText, Sparkles, Crown, Star, Zap, Heart } from "lucide-react";
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
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-6"></div>
            <p className="text-gray-600 font-medium">✨ Chargement de votre espace...</p>
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
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 relative overflow-hidden animate-fade-in">
      {/* Enhanced animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/8 via-indigo-600/8 to-purple-600/8"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/25 to-indigo-400/25 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-purple-400/25 to-blue-400/25 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-indigo-300/15 to-purple-300/15 rounded-full blur-3xl animate-bounce-gentle"></div>
        
        {/* Floating magical particles */}
        <div className="absolute top-10 left-10 w-6 h-6 bg-blue-500/70 rounded-full animate-pulse shadow-lg"></div>
        <div className="absolute top-20 right-20 w-8 h-8 bg-indigo-500/70 rounded-full animate-pulse delay-500 shadow-lg"></div>
        <div className="absolute bottom-20 left-20 w-7 h-7 bg-purple-500/70 rounded-full animate-pulse delay-1000 shadow-lg"></div>
        <div className="absolute bottom-10 right-10 w-5 h-5 bg-blue-400/70 rounded-full animate-pulse delay-1500 shadow-lg"></div>
        <div className="absolute top-1/3 left-1/5 w-4 h-4 bg-indigo-400/60 rounded-full animate-bounce-gentle delay-2000"></div>
        <div className="absolute bottom-1/3 right-1/5 w-6 h-6 bg-purple-400/60 rounded-full animate-bounce-gentle delay-3000"></div>
      </div>
      
      <div className="relative z-10 w-full px-4 py-6 md:py-8">
        {/* Magical Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 backdrop-blur-xl bg-white/25 rounded-3xl p-6 md:p-8 shadow-2xl border border-white/40 w-full hover:shadow-blue-500/25 hover:bg-white/30 transition-all duration-500 hover:scale-[1.02]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse-glow">
              <Heart className="w-8 h-8 text-white animate-bounce-gentle" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ✨ Mon Espace Personnel
              </h1>
              <p className="text-blue-600/90 text-base font-semibold">Bienvenue dans votre univers SendFlow</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationSystem />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchBalance}
              disabled={isLoadingBalance}
              className="hover:bg-blue-50/80 border-2 border-blue-300/50 backdrop-blur-sm bg-white/60 text-blue-700 hover:text-blue-800 shadow-xl hover:shadow-blue-500/30 transition-all duration-300 rounded-2xl font-medium h-12 px-4"
            >
              <RefreshCw className={`w-5 h-5 ${isLoadingBalance ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-2">Actualiser</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-700 hover:bg-red-50/80 border-2 border-red-300/50 backdrop-blur-sm bg-white/60 shadow-xl hover:shadow-red-500/30 transition-all duration-300 rounded-2xl font-medium h-12 px-4"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline ml-2">Déconnexion</span>
            </Button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="w-full mb-8">
          <UserProfileInfo />
        </div>

        {/* Magical Balance Card */}
        <Card className="mb-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white border-0 shadow-2xl hover:shadow-blue-500/50 transform hover:-translate-y-3 hover:scale-105 transition-all duration-500 w-full overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-purple-400/30 animate-pulse"></div>
          <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <CardContent className="p-8 md:p-10 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="w-6 h-6 text-blue-200 animate-pulse" />
                  <p className="text-blue-100 text-base font-semibold">💰 Mon Solde Principal</p>
                </div>
                <p className="text-4xl md:text-5xl font-bold mb-3 drop-shadow-lg">
                  {formatCurrency(convertedBalance, userCurrency)}
                </p>
                {userCurrency !== "XAF" && (
                  <p className="text-sm text-blue-200 font-medium">
                    Converti de {formatCurrency(balance, "XAF")}
                  </p>
                )}
              </div>
              <div className="w-20 h-20 bg-gradient-to-r from-white/25 to-white/15 rounded-3xl flex items-center justify-center backdrop-blur-sm shadow-xl">
                <Wallet className="w-10 h-10 text-white animate-bounce-gentle" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="w-full">
          {/* Magical Actions */}
          <Card className="bg-white/35 backdrop-blur-xl border-2 border-white/30 shadow-2xl w-full hover:shadow-blue-500/25 transition-all duration-500 overflow-hidden hover:bg-white/40">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 to-purple-50/60"></div>
            <CardHeader className="pb-6 relative z-10">
              <CardTitle className="flex items-center gap-4 text-blue-800">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center shadow-xl">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">🚀 Actions Magiques</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 relative z-10">
              <Button 
                onClick={() => navigate('/transfer')}
                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold h-16 shadow-2xl hover:shadow-blue-500/40 transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 rounded-3xl text-lg"
              >
                <ArrowUpRight className="mr-4 h-7 w-7" />
                🌟 Transférer de l'argent
              </Button>
              
              <Button 
                onClick={() => setShowQRDialog(true)}
                variant="outline"
                className="w-full border-3 border-indigo-400/70 text-indigo-800 hover:bg-indigo-50/80 hover:border-indigo-500 font-bold h-16 shadow-xl hover:shadow-indigo-500/30 transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 rounded-3xl text-lg backdrop-blur-sm bg-white/70"
              >
                <QrCode className="mr-4 h-7 w-7" />
                📱 Mon QR Code Magique
              </Button>

              <Button 
                onClick={() => navigate('/savings')}
                variant="outline"
                className="w-full border-3 border-emerald-400/70 text-emerald-800 hover:bg-emerald-50/80 hover:border-emerald-500 font-bold h-16 shadow-xl hover:shadow-emerald-500/30 transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 rounded-3xl text-lg backdrop-blur-sm bg-white/70"
              >
                <PiggyBank className="mr-4 h-7 w-7" />
                🏦 Mes Épargnes
              </Button>

              <Button 
                onClick={() => navigate('/receipts')}
                variant="outline"
                className="w-full border-3 border-orange-400/70 text-orange-800 hover:bg-orange-50/80 hover:border-orange-500 font-bold h-16 shadow-xl hover:shadow-orange-500/30 transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 rounded-3xl text-lg backdrop-blur-sm bg-white/70"
              >
                <FileText className="mr-4 h-7 w-7" />
                📄 Mes Reçus
              </Button>
              
              <Button 
                onClick={() => navigate('/transactions')}
                variant="outline"
                className="w-full border-3 border-purple-400/70 text-purple-800 hover:bg-purple-50/80 hover:border-purple-500 font-bold h-16 shadow-xl hover:shadow-purple-500/30 transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 rounded-3xl text-lg backdrop-blur-sm bg-white/70"
              >
                <History className="mr-4 h-7 w-7" />
                📊 Historique des transactions
              </Button>
            </CardContent>
          </Card>

          {/* Enhanced Information Card */}
          <Card className="mt-8 bg-gradient-to-r from-blue-50/90 via-indigo-50/90 to-purple-50/90 border-l-8 border-blue-500 backdrop-blur-xl shadow-2xl w-full hover:shadow-blue-500/25 transition-all duration-500">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-xl">
                  <Star className="w-6 h-6 text-white animate-pulse" />
                </div>
                <h3 className="font-bold text-blue-900 text-xl">💡 Informations Importantes</h3>
              </div>
              <div className="space-y-4 text-sm text-blue-800 font-medium">
                <div className="flex items-start gap-4 p-4 bg-white/60 rounded-2xl backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <span className="text-2xl">📱</span>
                  <p>Pour effectuer un retrait, présentez votre QR Code magique à un agent</p>
                </div>
                <div className="flex items-start gap-4 p-4 bg-white/60 rounded-2xl backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <span className="text-2xl">⚡</span>
                  <p>Vos transferts sont traités instantanément comme par magie</p>
                </div>
                <div className="flex items-start gap-4 p-4 bg-white/60 rounded-2xl backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <span className="text-2xl">🔔</span>
                  <p>Consultez régulièrement vos notifications pour les mises à jour</p>
                </div>
                <div className="flex items-start gap-4 p-4 bg-white/60 rounded-2xl backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <span className="text-2xl">📄</span>
                  <p>Téléchargez vos reçus depuis la section "Mes Reçus"</p>
                </div>
                <div className="flex items-start gap-4 p-4 bg-white/60 rounded-2xl backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <span className="text-2xl">🏦</span>
                  <p>Créez des comptes d'épargne pour atteindre vos objectifs financiers</p>
                </div>
              </div>
            </CardContent>
          </Card>
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
