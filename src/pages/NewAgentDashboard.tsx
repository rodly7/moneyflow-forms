
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Camera, RefreshCw, LogOut, Wallet, Activity, DollarSign, History, Percent, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import UserProfileInfo from "@/components/profile/UserProfileInfo";
import { formatCurrency, getCurrencyForCountry, convertCurrency } from "@/integrations/supabase/client";

const NewAgentDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [balance, setBalance] = useState<number>(0);
  const [commissionBalance, setCommissionBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

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
      <div className="min-h-screen w-full bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement de votre profil...</p>
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
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 md:w-64 md:h-64 bg-emerald-200/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 md:w-96 md:h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <div className="relative z-10 w-full px-4 py-4 md:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 backdrop-blur-sm bg-white/70 rounded-2xl p-4 md:p-6 shadow-lg border border-white/20 w-full">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              Tableau de bord - Agent
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchBalances}
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

        {/* Profile Info */}
        <div className="w-full mb-6">
          <UserProfileInfo />
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 w-full">
          <Card className="bg-gradient-to-r from-emerald-600 to-green-600 text-white border-0 shadow-xl">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Solde Principal</p>
                  <p className="text-2xl md:text-3xl font-bold">
                    {formatCurrency(convertedBalance, agentCurrency)}
                  </p>
                  {agentCurrency !== "XAF" && (
                    <p className="text-xs text-emerald-200 mt-1">
                      Converti de {formatCurrency(balance, "XAF")}
                    </p>
                  )}
                </div>
                <Wallet className="w-8 h-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-xl">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Commissions</p>
                  <p className="text-2xl md:text-3xl font-bold">
                    {formatCurrency(convertedCommissionBalance, agentCurrency)}
                  </p>
                  {agentCurrency !== "XAF" && (
                    <p className="text-xs text-purple-200 mt-1">
                      Converti de {formatCurrency(commissionBalance, "XAF")}
                    </p>
                  )}
                </div>
                <Percent className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full">
          {/* Actions agent */}
          <div className="w-full">
            {/* Actions Rapides */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl w-full">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-emerald-600">
                  <DollarSign className="w-5 h-5" />
                  Actions Disponibles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => navigate('/transfer')}
                  className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-semibold h-12 shadow-lg"
                >
                  <ArrowUpRight className="mr-2 h-5 w-5" />
                  Transférer de l'argent
                </Button>
                
                <Button 
                  onClick={() => navigate('/deposit')}
                  variant="outline"
                  className="w-full border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-semibold h-12 shadow-md"
                >
                  <Wallet className="mr-2 h-5 w-5" />
                  Dépôt / Retrait client
                </Button>
                
                <Button 
                  onClick={() => navigate('/commission')}
                  variant="outline"
                  className="w-full border-2 border-purple-500 text-purple-600 hover:bg-purple-50 font-semibold h-12 shadow-md"
                >
                  <Percent className="mr-2 h-5 w-5" />
                  Mes Commissions
                </Button>
                
                <Button 
                  onClick={() => navigate('/transactions')}
                  variant="outline"
                  className="w-full border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-semibold h-12 shadow-md"
                >
                  <History className="mr-2 h-5 w-5" />
                  Historique des transactions
                </Button>

                <Button 
                  onClick={() => navigate('/agent-performance')}
                  variant="outline"
                  className="w-full border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold h-12 shadow-md"
                >
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Tableau de Performance
                </Button>
              </CardContent>
            </Card>

            {/* Information importante */}
            <Card className="mt-6 bg-gradient-to-r from-emerald-50 to-blue-50 border-l-4 border-emerald-500 w-full">
              <CardContent className="p-4">
                <h3 className="font-semibold text-emerald-800 mb-2">Information Agent</h3>
                <div className="space-y-2 text-sm text-emerald-700">
                  <p>• Pour les retraits clients, scannez obligatoirement leur QR Code</p>
                  <p>• Vous gagnez des commissions sur chaque opération</p>
                  <p>• Les dépôts clients sont sans frais pour eux</p>
                  <p>• Consultez régulièrement vos notifications</p>
                  <p>• Utilisez le tableau de performance pour améliorer vos résultats</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewAgentDashboard;
