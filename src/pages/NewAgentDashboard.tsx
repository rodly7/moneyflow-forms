
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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header compact */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Espace Agent</h1>
              <p className="text-sm text-muted-foreground">Dashboard professionnel</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationSystem />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchBalances}
              disabled={isLoadingBalance}
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Profile Info compact */}
        <UserProfileInfo />

        {/* Balance Cards simplifiés */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Solde Principal
                  </p>
                  <p className="text-3xl font-bold mt-1">
                    {formatCurrency(convertedBalance, agentCurrency)}
                  </p>
                  {agentCurrency !== "XAF" && (
                    <p className="text-xs text-emerald-200 mt-1">
                      {formatCurrency(balance, "XAF")}
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium flex items-center gap-2">
                    <Percent className="w-4 h-4" />
                    Commissions
                  </p>
                  <p className="text-3xl font-bold mt-1">
                    {formatCurrency(convertedCommissionBalance, agentCurrency)}
                  </p>
                  {agentCurrency !== "XAF" && (
                    <p className="text-xs text-purple-200 mt-1">
                      {formatCurrency(commissionBalance, "XAF")}
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions simplifiées */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Actions Agent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => navigate('/transfer')}
              className="w-full justify-start h-12"
            >
              <ArrowUpRight className="mr-3 h-5 w-5" />
              Transférer de l'argent
            </Button>
            
            <Button 
              onClick={() => navigate('/deposit')}
              variant="outline"
              className="w-full justify-start h-12"
            >
              <Wallet className="mr-3 h-5 w-5" />
              Dépôt / Retrait client
            </Button>
            
            <Button 
              onClick={() => navigate('/commission')}
              variant="outline"
              className="w-full justify-start h-12"
            >
              <Percent className="mr-3 h-5 w-5" />
              Mes Commissions
            </Button>

            <Button 
              onClick={() => navigate('/receipts')}
              variant="outline"
              className="w-full justify-start h-12"
            >
              <FileText className="mr-3 h-5 w-5" />
              Mes Reçus
            </Button>
            
            <Button 
              onClick={() => navigate('/transactions')}
              variant="outline"
              className="w-full justify-start h-12"
            >
              <History className="mr-3 h-5 w-5" />
              Historique
            </Button>

            <Button 
              onClick={() => navigate('/agent-performance')}
              variant="outline"
              className="w-full justify-start h-12"
            >
              <BarChart3 className="mr-3 h-5 w-5" />
              Performance
            </Button>
          </CardContent>
        </Card>

        {/* Guide Agent simplifié */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Guide Agent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <span className="text-lg">📱</span>
              <p className="text-sm">Scannez le QR Code client pour les retraits sécurisés</p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <span className="text-lg">💎</span>
              <p className="text-sm">Gagnez des commissions sur chaque opération</p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <span className="text-lg">🏦</span>
              <p className="text-sm">Les dépôts clients augmentent votre volume</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewAgentDashboard;
