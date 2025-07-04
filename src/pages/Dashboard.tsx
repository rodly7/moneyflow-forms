
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
import CompactHeader from "@/components/dashboard/CompactHeader";
import CompactStatsGrid from "@/components/dashboard/CompactStatsGrid";
import CompactActionGrid from "@/components/dashboard/CompactActionGrid";
import CompactInfoCard from "@/components/dashboard/CompactInfoCard";

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

  // Desktop compact dashboard
  const statsData = [
    {
      label: "Mon Solde",
      value: formatCurrency(convertedBalance, userCurrency),
      icon: Wallet,
      gradient: "bg-gradient-to-r from-blue-600 to-purple-600",
      textColor: "text-blue-100"
    }
  ];

  const actionItems = [
    {
      label: "Transférer de l'argent",
      icon: ArrowUpRight,
      onClick: () => navigate('/transfer'),
      variant: "default" as const
    },
    {
      label: "Mon QR Code",
      icon: QrCode,
      onClick: () => setShowQRDialog(true),
      variant: "outline" as const
    },
    {
      label: "Mes Épargnes",
      icon: PiggyBank,
      onClick: () => navigate('/savings'),
      variant: "outline" as const
    },
    {
      label: "Mes Reçus",
      icon: FileText,
      onClick: () => navigate('/receipts'),
      variant: "outline" as const
    },
    {
      label: "Historique",
      icon: History,
      onClick: () => navigate('/transactions'),
      variant: "outline" as const
    }
  ];

  const infoItems = [
    {
      icon: "📱",
      text: "Présentez votre QR Code à un agent pour effectuer un retrait"
    },
    {
      icon: "⚡",
      text: "Vos transferts sont traités instantanément"
    },
    {
      icon: "🔔",
      text: "Consultez vos notifications régulièrement"
    }
  ];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Ultra Clean Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserProfileInfo />
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchBalance}
              disabled={isLoadingBalance}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="h-8 w-8 p-0"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Clean Balance Display */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Solde disponible</p>
              <p className="text-3xl font-light">{formatCurrency(convertedBalance, userCurrency)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Minimal Actions Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/transfer')}
            className="h-20 flex-col gap-2 border-2 hover:border-primary/50"
          >
            <ArrowUpRight className="h-5 w-5" />
            <span className="text-xs">Transférer</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowQRDialog(true)}
            className="h-20 flex-col gap-2 border-2 hover:border-primary/50"
          >
            <QrCode className="h-5 w-5" />
            <span className="text-xs">Mon QR</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/savings')}
            className="h-20 flex-col gap-2 border-2 hover:border-primary/50"
          >
            <PiggyBank className="h-5 w-5" />
            <span className="text-xs">Épargnes</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/transactions')}
            className="h-20 flex-col gap-2 border-2 hover:border-primary/50"
          >
            <History className="h-5 w-5" />
            <span className="text-xs">Historique</span>
          </Button>
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
