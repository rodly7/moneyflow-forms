import { memo, Suspense, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { usePerformanceMonitor, useDebounce } from "@/hooks/usePerformanceOptimization";
import { ArrowUpRight, QrCode, Wallet, History, PiggyBank, FileText, RefreshCw, LogOut, Heart, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, getCurrencyForCountry, convertCurrency } from "@/integrations/supabase/client";

interface MobileOptimizedDashboardProps {
  userBalance: number;
  userProfile: any;
  onRefresh: () => void;
  isLoading: boolean;
}

const MobileLoadingSkeleton = memo(() => (
  <div className="space-y-4 p-4">
    {[...Array(3)].map((_, i) => (
      <Card key={i} className="animate-pulse">
        <CardContent className="p-4">
          <div className="h-16 bg-muted rounded"></div>
        </CardContent>
      </Card>
    ))}
  </div>
));

const MobileBalanceCard = memo(({ balance, currency }: { balance: number; currency: string }) => (
  <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-primary-foreground/80 text-xs">MON SOLDE</p>
          <p className="text-xl font-bold">{formatCurrency(balance, currency)}</p>
        </div>
        <Wallet className="w-8 h-8 text-primary-foreground/80" />
      </div>
    </CardContent>
  </Card>
));

const MobileActionGrid = memo(({ onAction }: { onAction: (action: string) => void }) => {
  const actions = [
    { key: 'transfer', icon: ArrowUpRight, label: 'Transférer', color: 'bg-blue-500' },
    { key: 'qr-code', icon: QrCode, label: 'Mon QR', color: 'bg-green-500' },
    { key: 'savings', icon: PiggyBank, label: 'Épargnes', color: 'bg-purple-500' },
    { key: 'transactions', icon: History, label: 'Historique', color: 'bg-orange-500' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {actions.map(({ key, icon: Icon, label, color }) => (
        <Button
          key={key}
          onClick={() => onAction(key)}
          variant="outline"
          className="h-16 flex-col gap-1 border-2 hover:scale-105 transition-transform"
        >
          <div className={`w-6 h-6 rounded-full ${color} flex items-center justify-center`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-medium">{label}</span>
        </Button>
      ))}
    </div>
  );
});

const MobileOptimizedDashboard = memo(({ 
  userBalance, 
  userProfile, 
  onRefresh, 
  isLoading 
}: MobileOptimizedDashboardProps) => {
  const deviceInfo = useDeviceDetection();
  const { renderCount } = usePerformanceMonitor('MobileOptimizedDashboard');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut } = useAuth();

  const debouncedRefresh = useDebounce(onRefresh, 300);

  const userCurrency = useMemo(() => 
    getCurrencyForCountry(userProfile?.country || "Cameroun"), 
    [userProfile?.country]
  );

  const convertedBalance = useMemo(() => 
    convertCurrency(userBalance, "XAF", userCurrency), 
    [userBalance, userCurrency]
  );

  const handleAction = useMemo(() => (action: string) => {
    switch (action) {
      case 'transfer':
        navigate('/transfer');
        break;
      case 'qr-code':
        navigate('/qr-code');
        break;
      case 'savings':
        navigate('/savings');
        break;
      case 'transactions':
        navigate('/transactions');
        break;
      default:
        break;
    }
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <MobileLoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Stunning Mobile Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-0.5">
        <div className="bg-white rounded-b-2xl">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Mon Espace
                </h1>
                <p className="text-xs text-muted-foreground">Bienvenue !</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={debouncedRefresh}
                disabled={isLoading}
                className="h-9 w-9 p-0 hover:scale-110 transition-transform"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="h-9 w-9 p-0 hover:scale-110 transition-transform"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Gorgeous Content */}
      <div className="p-4 space-y-6 pb-20">
        {/* Stunning Balance Card */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 rounded-2xl text-white shadow-2xl">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                  <Wallet className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <p className="text-white/80 text-sm mb-2">Solde disponible</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-yellow-200 to-yellow-400 bg-clip-text text-transparent">
                  {formatCurrency(convertedBalance, userCurrency)}
                </p>
              </div>
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Beautiful Actions */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'transfer', icon: ArrowUpRight, label: 'Transférer', colors: 'from-pink-500 to-purple-500', bg: 'from-pink-600 to-purple-600' },
            { key: 'qr-code', icon: QrCode, label: 'Mon QR', colors: 'from-green-500 to-teal-500', bg: 'from-green-600 to-teal-600' },
            { key: 'savings', icon: PiggyBank, label: 'Épargnes', colors: 'from-emerald-500 to-green-500', bg: 'from-emerald-600 to-green-600' },
            { key: 'transactions', icon: History, label: 'Historique', colors: 'from-orange-500 to-red-500', bg: 'from-orange-600 to-red-600' },
          ].map(({ key, icon: Icon, label, colors, bg }) => (
            <div key={key} className="group relative">
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${bg} rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-500`}></div>
              <button
                onClick={() => handleAction(key)}
                className="relative w-full h-20 bg-white rounded-xl flex flex-col items-center justify-center gap-2 shadow-lg hover:scale-105 transition-transform duration-300"
              >
                <div className={`p-2 bg-gradient-to-r ${colors} rounded-full`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium">{label}</span>
              </button>
            </div>
          ))}
        </div>

        {/* Attractive Tips */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border-l-4 border-l-indigo-500">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-indigo-100 rounded-full">
              <Sparkles className="h-4 w-4 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-indigo-900 text-sm">Conseils</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
              <p className="text-xs text-indigo-700">QR Code pour les retraits</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
              <p className="text-xs text-purple-700">Transferts instantanés</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

MobileOptimizedDashboard.displayName = 'MobileOptimizedDashboard';
MobileLoadingSkeleton.displayName = 'MobileLoadingSkeleton';
MobileBalanceCard.displayName = 'MobileBalanceCard';
MobileActionGrid.displayName = 'MobileActionGrid';

export default MobileOptimizedDashboard;