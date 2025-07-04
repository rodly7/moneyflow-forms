
import { useState, useEffect, Suspense } from "react";
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
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { usePerformanceMonitor, useDebounce } from "@/hooks/usePerformanceOptimization";
import MobileOptimizedDashboard from "@/components/mobile/MobileOptimizedDashboard";

const Dashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const deviceInfo = useDeviceDetection();
  const { renderCount } = usePerformanceMonitor('Dashboard');
  const [balance, setBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);

  // Utiliser le hook de vérification du solde
  useBalanceCheck(balance);

  const fetchBalance = useDebounce(async () => {
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
  }, 300);

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

  // Use mobile-optimized dashboard on mobile devices
  if (deviceInfo.isMobile) {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <MobileOptimizedDashboard
          userBalance={balance}
          userProfile={profile}
          onRefresh={fetchBalance}
          isLoading={isLoadingBalance}
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header compact */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Mon Espace</h1>
              <p className="text-sm text-muted-foreground">Dashboard utilisateur</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationSystem />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchBalance}
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

        {/* Balance Card simplifié */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Mon Solde
                </p>
                <p className="text-3xl font-bold mt-1">
                  {formatCurrency(convertedBalance, userCurrency)}
                </p>
                {userCurrency !== "XAF" && (
                  <p className="text-xs text-blue-200 mt-1">
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

        {/* Actions simplifiées */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Actions rapides
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
              onClick={() => setShowQRDialog(true)}
              variant="outline"
              className="w-full justify-start h-12"
            >
              <QrCode className="mr-3 h-5 w-5" />
              Mon QR Code
            </Button>

            <Button 
              onClick={() => navigate('/savings')}
              variant="outline"
              className="w-full justify-start h-12"
            >
              <PiggyBank className="mr-3 h-5 w-5" />
              Mes Épargnes
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
          </CardContent>
        </Card>

        {/* Informations simplifiées */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Informations utiles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <span className="text-lg">📱</span>
              <p className="text-sm">Présentez votre QR Code à un agent pour effectuer un retrait</p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <span className="text-lg">⚡</span>
              <p className="text-sm">Vos transferts sont traités instantanément</p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <span className="text-lg">🔔</span>
              <p className="text-sm">Consultez vos notifications régulièrement</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <QRCodeGenerator 
        isOpen={showQRDialog}
        onClose={() => setShowQRDialog(false)}
      />
    </div>
  );
};

export default Dashboard;
