
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Camera, RefreshCw, LogOut, Wallet, Activity, DollarSign, History, Percent, BarChart3, FileText, Crown, Sparkles, Shield, Zap, Star, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import UserProfileInfo from "@/components/profile/UserProfileInfo";

import { formatCurrency, getCurrencyForCountry, convertCurrency } from "@/integrations/supabase/client";
import { useBalanceCheck } from "@/hooks/useBalanceCheck";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { usePerformanceMonitor, useDebounce } from "@/hooks/usePerformanceOptimization";
import CompactHeader from "@/components/dashboard/CompactHeader";
import CompactStatsGrid from "@/components/dashboard/CompactStatsGrid";
import CompactActionGrid from "@/components/dashboard/CompactActionGrid";
import CompactInfoCard from "@/components/dashboard/CompactInfoCard";
import SystemMetricsCard from "@/components/dashboard/SystemMetricsCard";
import { useAgentLocationTracker } from "@/hooks/useSystemMetrics";

const NewAgentDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const deviceInfo = useDeviceDetection();
  const { renderCount } = usePerformanceMonitor('NewAgentDashboard');
  const [balance, setBalance] = useState<number>(0);
  const [commissionBalance, setCommissionBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const { updateLocation, deactivateLocation } = useAgentLocationTracker();

  // Utiliser le hook de vérification du solde
  useBalanceCheck(balance);

  const fetchBalances = useDebounce(async () => {
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
    fetchBalances();
    
    // Géolocalisation automatique pour les agents
    if (profile?.role === 'agent' && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const address = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
          updateLocation(latitude, longitude, address);
        },
        (error) => {
          console.log('Géolocalisation non disponible:', error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
        deactivateLocation();
      };
    }
  }, [user, profile]);

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

  // Stats pour le grid compact
  const statsData = [
    {
      label: "Solde Principal",
      value: formatCurrency(convertedBalance, agentCurrency),
      icon: Wallet,
      gradient: "bg-gradient-to-r from-emerald-600 to-teal-600",
      textColor: "text-emerald-100"
    },
    {
      label: "Commissions",
      value: formatCurrency(convertedCommissionBalance, agentCurrency),
      icon: Percent,
      gradient: "bg-gradient-to-r from-purple-600 to-pink-600",
      textColor: "text-purple-100"
    }
  ];

  // Actions pour l'agent
  const actionItems = [
    {
      label: "Transférer de l'argent",
      icon: ArrowUpRight,
      onClick: () => navigate('/transfer'),
      variant: "default" as const
    },
    {
      label: "Dépôt / Retrait client",
      icon: Wallet,
      onClick: () => navigate('/deposit'),
      variant: "outline" as const
    },
    {
      label: "Mes Commissions",
      icon: Percent,
      onClick: () => navigate('/commission'),
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
    },
    {
      label: "Performance",
      icon: BarChart3,
      onClick: () => navigate('/agent-performance'),
      variant: "outline" as const
    }
  ];

  // Informations pour l'agent
  const infoItems = [
    {
      icon: "📱",
      text: "Scannez le QR Code client pour les retraits sécurisés"
    },
    {
      icon: "💎",
      text: "Gagnez des commissions sur chaque opération"
    },
    {
      icon: "🏦",
      text: "Les dépôts clients augmentent votre volume"
    }
  ];

  return (
    <div className="min-h-screen bg-background p-3">
      <div className="max-w-5xl mx-auto space-y-4">
        <CompactHeader
          title="Espace Agent"
          subtitle="Dashboard professionnel"
          icon={<Trophy className="w-4 h-4 text-primary-foreground" />}
          onRefresh={fetchBalances}
          onSignOut={handleSignOut}
          isLoading={isLoadingBalance}
        />

        <div className="bg-card p-3 rounded-lg">
          <UserProfileInfo />
        </div>

        <CompactStatsGrid stats={statsData} />

        <SystemMetricsCard />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CompactActionGrid
            title="Actions Agent"
            titleIcon={Zap}
            actions={actionItems}
          />
          
          <CompactInfoCard
            title="Guide Agent"
            titleIcon={Shield}
            items={infoItems}
          />
        </div>
      </div>
    </div>
  );
};

export default NewAgentDashboard;
