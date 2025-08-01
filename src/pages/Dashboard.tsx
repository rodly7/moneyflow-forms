
import { useState, useEffect, Suspense, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAutoBalanceRefresh } from "@/hooks/useAutoBalanceRefresh";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, QrCode, RefreshCw, LogOut, Wallet, History, PiggyBank, FileText, Sparkles, Crown, Star, Zap, Eye, EyeOff, Scan } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import { formatCurrency, getCurrencyForCountry, convertCurrency } from "@/integrations/supabase/client";
import { useBalanceCheck } from "@/hooks/useBalanceCheck";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import MobileOptimizedDashboard from "@/components/mobile/MobileOptimizedDashboard";
import NotificationSystem from "@/components/notifications/NotificationSystem";
import { MonthlyLimitCard } from "@/components/dashboard/MonthlyLimitCard";

const Dashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const deviceInfo = useDeviceDetection();
  const [balance, setBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showBalance, setShowBalance] = useState(false);

  useBalanceCheck(balance);

  // Auto-rafraîchissement optimisé du solde
  useAutoBalanceRefresh({
    intervalMs: 20000, // 20 secondes - plus rapide
    enableRealtime: true,
    onBalanceChange: (newBalance) => {
      setBalance(newBalance);
      toast({
        title: "💰 Solde mis à jour",
        description: `Nouveau solde : ${formatCurrency(convertCurrency(newBalance, "XAF", userCurrency), userCurrency)}`,
        duration: 3000,
      });
    }
  });

  const fetchBalance = useCallback(async () => {
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
  }, [user?.id, toast]);

  const handleSignOut = useCallback(async () => {
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
  }, [signOut, navigate, toast]);

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

  const userCurrency = useMemo(() => 
    getCurrencyForCountry(profile.country || "Cameroun"), 
    [profile.country]
  );
  
  const convertedBalance = useMemo(() => 
    convertCurrency(balance, "XAF", userCurrency), 
    [balance, userCurrency]
  );

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Professional Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-1 rounded-3xl shadow-xl">
          <div className="bg-white rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Espace Utilisateur</h1>
                  <p className="text-gray-600">Dashboard personnel</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <NotificationSystem />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={fetchBalance}
                  disabled={isLoadingBalance}
                  className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <RefreshCw className={`h-5 w-5 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* User Info Section */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{profile?.full_name || 'Utilisateur'}</h2>
                  <div className="flex items-center gap-4 text-gray-600">
                    <span>{profile?.phone || 'Téléphone non renseigné'}</span>
                    {profile?.country && (
                      <>
                        <span>•</span>
                        <span>{profile.country}</span>
                      </>
                    )}
                  </div>
                  {profile?.address && (
                    <div className="flex items-center gap-2 text-gray-500 mt-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>{profile.address}</span>
                    </div>
                  )}
                </div>
              </div>
              {profile?.is_verified && (
                <div className="p-2 bg-green-500 rounded-full">
                  <Star className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stunning Balance Card */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
          <Card className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 border-0 text-white shadow-2xl">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                    <Wallet className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-white/80 text-sm mb-1">👤 {profile?.full_name || 'Utilisateur'}</p>
                      {profile?.address && (
                        <p className="text-white/70 text-xs">📍 {profile.address}</p>
                      )}
                    </div>
                    <button 
                      onClick={() => setShowBalance(!showBalance)}
                      className="text-white/80 hover:text-white transition-colors"
                      aria-label={showBalance ? "Masquer le solde" : "Afficher le solde"}
                    >
                      {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-white/80 text-sm mb-2">Solde disponible</p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-yellow-200 to-yellow-400 bg-clip-text text-transparent">
                    {showBalance ? formatCurrency(convertedBalance, userCurrency) : "••••••"}
                  </p>
                </div>
                <div className="flex justify-center space-x-1">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Limit Card */}
        <MonthlyLimitCard />

        {/* Beautiful Actions Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/transfer')}
              className="relative w-full h-24 flex-col gap-3 bg-white border-0 hover:bg-gray-50 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full">
                <ArrowUpRight className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium">Transférer</span>
            </Button>
          </div>
          
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
            <Button 
              variant="outline" 
              onClick={() => setShowQRDialog(true)}
              className="relative w-full h-24 flex-col gap-3 bg-white border-0 hover:bg-gray-50 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <div className="p-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-full">
                <QrCode className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium">Mon QR</span>
            </Button>
          </div>
          
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/savings')}
              className="relative w-full h-24 flex-col gap-3 bg-white border-0 hover:bg-gray-50 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full">
                <PiggyBank className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium">Épargnes</span>
            </Button>
          </div>
          
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/transactions')}
              className="relative w-full h-24 flex-col gap-3 bg-white border-0 hover:bg-gray-50 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full">
                <History className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium">Historique</span>
            </Button>
          </div>
          
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/qr-payment')}
              className="relative w-full h-24 flex-col gap-3 bg-white border-0 hover:bg-gray-50 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full">
                <Scan className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium">Payer QR</span>
            </Button>
          </div>
          
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-600 to-amber-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/bill-payments')}
              className="relative w-full h-24 flex-col gap-3 bg-white border-0 hover:bg-gray-50 transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <div className="p-2 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium">Factures</span>
            </Button>
          </div>
        </div>

        {/* Attractive Tips Section */}
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-l-indigo-500 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 rounded-full">
                <Sparkles className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-indigo-900">Conseils utiles</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <p className="text-sm text-indigo-700">Présentez votre QR Code pour les retraits</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <p className="text-sm text-purple-700">Vos transferts sont traités instantanément</p>
              </div>
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
