import { memo, Suspense, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";
import { usePerformanceMonitor, useDebounce } from "@/hooks/usePerformanceOptimization";
import { ArrowUpRight, QrCode, Wallet, History, PiggyBank, FileText, RefreshCw, LogOut } from "lucide-react";
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
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-lg font-bold">Mon Espace</h1>
            <p className="text-xs text-muted-foreground">Dashboard mobile</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={debouncedRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
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
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 pb-20">
        <MobileBalanceCard balance={convertedBalance} currency={userCurrency} />
        <MobileActionGrid onAction={handleAction} />
        
        {/* Tips Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">💡 Conseils rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs text-muted-foreground">
              • Utilisez votre QR Code pour les retraits
            </div>
            <div className="text-xs text-muted-foreground">
              • Vos transferts sont instantanés
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-20 right-4 bg-primary text-primary-foreground p-2 rounded text-xs z-50">
          {deviceInfo.isMobile ? 'Mobile' : 'Desktop'} | Renders: {renderCount}
        </div>
      )}
    </div>
  );
});

MobileOptimizedDashboard.displayName = 'MobileOptimizedDashboard';
MobileLoadingSkeleton.displayName = 'MobileLoadingSkeleton';
MobileBalanceCard.displayName = 'MobileBalanceCard';
MobileActionGrid.displayName = 'MobileActionGrid';

export default MobileOptimizedDashboard;