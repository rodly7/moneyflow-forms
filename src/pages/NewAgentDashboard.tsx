
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Camera, RefreshCw, LogOut, Wallet, Activity, DollarSign, History, Percent, BarChart3, FileText, Crown, Sparkles, Shield, Zap, Star, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import UserProfileInfo from "@/components/profile/UserProfileInfo";
import NotificationSystem from "@/components/notifications/NotificationSystem";
import { formatCurrency, getCurrencyForCountry, convertCurrency } from "@/integrations/supabase/client";
import { useBalanceCheck } from "@/hooks/useBalanceCheck";

const NewAgentDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [balance, setBalance] = useState<number>(0);
  const [commissionBalance, setCommissionBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Utiliser le hook de vérification du solde
  useBalanceCheck(balance);

  const fetchBalances = async () => {
    if (user?.id) {
      setIsLoadingBalance(true);
      try {
        // Récupérer le solde principal
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', user.id)
          .single();
        
        if (profileError) throw profileError;
        setBalance(profileData.balance || 0);

        // Récupérer le solde de commission
        const { data: agentData, error: agentError } = await supabase
          .from('agents')
          .select('commission_balance')
          .eq('user_id', user.id)
          .single();
        
        if (agentError) {
          console.log("Agent data not found, setting commission to 0");
          setCommissionBalance(0);
        } else {
          setCommissionBalance(agentData.commission_balance || 0);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des soldes:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger vos soldes",
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
    fetchBalances();
  }, [user]);

  if (!profile) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-600 mx-auto mb-6"></div>
            <p className="text-gray-600 font-medium">🌟 Chargement de votre espace agent...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Déterminer la devise basée sur le pays de l'agent
  const agentCurrency = getCurrencyForCountry(profile.country || "Cameroun");
  
  // Convertir les soldes de XAF (devise de base) vers la devise de l'agent
  const convertedBalance = convertCurrency(balance, "XAF", agentCurrency);
  const convertedCommissionBalance = convertCurrency(commissionBalance, "XAF", agentCurrency);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100 relative overflow-hidden animate-fade-in">
      {/* Enhanced magical background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-600/8 via-teal-600/8 to-green-600/8"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-emerald-400/25 to-teal-400/25 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-teal-400/25 to-green-400/25 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-emerald-300/15 to-teal-300/15 rounded-full blur-3xl animate-bounce-gentle"></div>
        
        {/* Floating professional particles */}
        <div className="absolute top-10 left-10 w-6 h-6 bg-emerald-500/70 rounded-full animate-pulse shadow-lg"></div>
        <div className="absolute top-20 right-20 w-8 h-8 bg-teal-500/70 rounded-full animate-pulse delay-500 shadow-lg"></div>
        <div className="absolute bottom-20 left-20 w-7 h-7 bg-green-500/70 rounded-full animate-pulse delay-1000 shadow-lg"></div>
        <div className="absolute bottom-10 right-10 w-5 h-5 bg-emerald-400/70 rounded-full animate-pulse delay-1500 shadow-lg"></div>
        <div className="absolute top-1/3 left-1/5 w-4 h-4 bg-teal-400/60 rounded-full animate-bounce-gentle delay-2000"></div>
        <div className="absolute bottom-1/3 right-1/5 w-6 h-6 bg-green-400/60 rounded-full animate-bounce-gentle delay-3000"></div>
      </div>
      
      <div className="relative z-10 w-full px-4 py-6 md:py-8">
        {/* Enhanced Professional Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 backdrop-blur-xl bg-white/25 rounded-3xl p-6 md:p-8 shadow-2xl border border-white/40 w-full hover:shadow-emerald-500/25 hover:bg-white/30 transition-all duration-500 hover:scale-[1.02]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 rounded-3xl flex items-center justify-center shadow-2xl animate-pulse-glow">
              <Trophy className="w-8 h-8 text-white animate-bounce-gentle" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 bg-clip-text text-transparent">
                👑 Agent Professionnel Elite
              </h1>
              <p className="text-emerald-700/90 text-base font-semibold">Votre centre de contrôle privilégié</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationSystem />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchBalances}
              disabled={isLoadingBalance}
              className="hover:bg-emerald-50/80 border-2 border-emerald-300/50 backdrop-blur-sm bg-white/60 text-emerald-700 hover:text-emerald-800 shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 rounded-2xl font-medium h-12 px-4"
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

        {/* Enhanced Dual Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 w-full">
          <Card className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 text-white border-0 shadow-2xl hover:shadow-emerald-500/50 transform hover:-translate-y-3 hover:scale-105 transition-all duration-500 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/30 to-teal-400/30 animate-pulse"></div>
            <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <CardContent className="p-8 md:p-10 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles className="w-6 h-6 text-emerald-200 animate-pulse" />
                    <p className="text-emerald-100 text-base font-semibold">💰 Solde Principal</p>
                  </div>
                  <p className="text-4xl md:text-5xl font-bold mb-3 drop-shadow-lg">
                    {formatCurrency(convertedBalance, agentCurrency)}
                  </p>
                  {agentCurrency !== "XAF" && (
                    <p className="text-sm text-emerald-200 font-medium">
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

          <Card className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white border-0 shadow-2xl hover:shadow-purple-500/50 transform hover:-translate-y-3 hover:scale-105 transition-all duration-500 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/30 to-pink-400/30 animate-pulse"></div>
            <div className="absolute top-4 right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <CardContent className="p-8 md:p-10 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Star className="w-6 h-6 text-purple-200 animate-pulse" />
                    <p className="text-purple-100 text-base font-semibold">💎 Commissions Elite</p>
                  </div>
                  <p className="text-4xl md:text-5xl font-bold mb-3 drop-shadow-lg">
                    {formatCurrency(convertedCommissionBalance, agentCurrency)}
                  </p>
                  {agentCurrency !== "XAF" && (
                    <p className="text-sm text-purple-200 font-medium">
                      Converti de {formatCurrency(commissionBalance, "XAF")}
                    </p>
                  )}
                </div>
                <div className="w-20 h-20 bg-gradient-to-r from-white/25 to-white/15 rounded-3xl flex items-center justify-center backdrop-blur-sm shadow-xl">
                  <Percent className="w-10 h-10 text-white animate-bounce-gentle" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full">
          {/* Enhanced Professional Actions */}
          <Card className="bg-white/35 backdrop-blur-xl border-2 border-white/30 shadow-2xl w-full hover:shadow-emerald-500/25 transition-all duration-500 overflow-hidden hover:bg-white/40">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 to-teal-50/60"></div>
            <CardHeader className="pb-6 relative z-10">
              <CardTitle className="flex items-center gap-4 text-emerald-800">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center shadow-xl">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold">🚀 Actions Professionnelles</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 relative z-10">
              <Button 
                onClick={() => navigate('/transfer')}
                className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-700 hover:via-teal-700 hover:to-green-700 text-white font-bold h-16 shadow-2xl hover:shadow-emerald-500/40 transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 rounded-3xl text-lg"
              >
                <ArrowUpRight className="mr-4 h-7 w-7" />
                💸 Transférer de l'argent
              </Button>
              
              <Button 
                onClick={() => navigate('/deposit')}
                variant="outline"
                className="w-full border-3 border-emerald-400/70 text-emerald-800 hover:bg-emerald-50/80 hover:border-emerald-500 font-bold h-16 shadow-xl hover:shadow-emerald-500/30 transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 rounded-3xl text-lg backdrop-blur-sm bg-white/70"
              >
                <Wallet className="mr-4 h-7 w-7" />
                🏦 Dépôt / Retrait client
              </Button>
              
              <Button 
                onClick={() => navigate('/commission')}
                variant="outline"
                className="w-full border-3 border-purple-400/70 text-purple-800 hover:bg-purple-50/80 hover:border-purple-500 font-bold h-16 shadow-xl hover:shadow-purple-500/30 transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 rounded-3xl text-lg backdrop-blur-sm bg-white/70"
              >
                <Percent className="mr-4 h-7 w-7" />
                💎 Mes Commissions Elite
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
                className="w-full border-3 border-blue-400/70 text-blue-800 hover:bg-blue-50/80 hover:border-blue-500 font-bold h-16 shadow-xl hover:shadow-blue-500/30 transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 rounded-3xl text-lg backdrop-blur-sm bg-white/70"
              >
                <History className="mr-4 h-7 w-7" />
                📊 Historique des transactions
              </Button>

              <Button 
                onClick={() => navigate('/agent-performance')}
                variant="outline"
                className="w-full border-3 border-yellow-400/70 text-yellow-800 hover:bg-yellow-50/80 hover:border-yellow-500 font-bold h-16 shadow-xl hover:shadow-yellow-500/30 transform hover:-translate-y-2 hover:scale-105 transition-all duration-300 rounded-3xl text-lg backdrop-blur-sm bg-white/70"
              >
                <BarChart3 className="mr-4 h-7 w-7" />
                📈 Tableau de Performance
              </Button>
            </CardContent>
          </Card>

          {/* Enhanced Professional Information */}
          <Card className="mt-8 bg-gradient-to-r from-emerald-50/90 via-teal-50/90 to-green-50/90 border-l-8 border-emerald-500 backdrop-blur-xl shadow-2xl w-full hover:shadow-emerald-500/25 transition-all duration-500">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-xl">
                  <Shield className="w-6 h-6 text-white animate-pulse" />
                </div>
                <h3 className="font-bold text-emerald-900 text-xl">👑 Guide Agent Professionnel</h3>
              </div>
              <div className="space-y-4 text-sm text-emerald-800 font-medium">
                <div className="flex items-start gap-4 p-4 bg-white/60 rounded-2xl backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <span className="text-2xl">📱</span>
                  <p>Scannez obligatoirement le QR Code client pour les retraits sécurisés</p>
                </div>
                <div className="flex items-start gap-4 p-4 bg-white/60 rounded-2xl backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <span className="text-2xl">💎</span>
                  <p>Gagnez des commissions attractives sur chaque opération réussie</p>
                </div>
                <div className="flex items-start gap-4 p-4 bg-white/60 rounded-2xl backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <span className="text-2xl">🏦</span>
                  <p>Les dépôts clients sont gratuits et augmentent votre volume</p>
                </div>
                <div className="flex items-start gap-4 p-4 bg-white/60 rounded-2xl backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <span className="text-2xl">🔔</span>
                  <p>Restez informé avec nos notifications en temps réel</p>
                </div>
                <div className="flex items-start gap-4 p-4 bg-white/60 rounded-2xl backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <span className="text-2xl">📈</span>
                  <p>Analysez vos performances pour maximiser vos revenus</p>
                </div>
                <div className="flex items-start gap-4 p-4 bg-white/60 rounded-2xl backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                  <span className="text-2xl">📄</span>
                  <p>Archivez vos reçus pour un suivi professionnel optimal</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewAgentDashboard;
