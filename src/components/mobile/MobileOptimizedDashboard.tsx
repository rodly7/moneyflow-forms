import { memo, Suspense, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, QrCode, Wallet, History, PiggyBank, FileText, RefreshCw, LogOut, Sparkles, Crown, Star, Eye, EyeOff, Scan, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, getCurrencyForCountry, convertCurrency } from "@/integrations/supabase/client";
import NotificationSystem from "@/components/notifications/NotificationSystem";

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
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const [showBalance, setShowBalance] = useState(false);

  const userCurrency = useMemo(() => 
    getCurrencyForCountry(userProfile?.country || "Cameroun"), 
    [userProfile?.country]
  );

  const convertedBalance = useMemo(() => 
    convertCurrency(userBalance, "XAF", userCurrency), 
    [userBalance, userCurrency]
  );

  const handleAction = useCallback((action: string) => {
    switch (action) {
      case 'transfer':
        navigate('/transfer');
        break;
      case 'qr-code':
        navigate('/qr-code');
        break;
      case 'qr-payment':
        navigate('/qr-payment');
        break;
      case 'savings':
        navigate('/savings');
        break;
      case 'transactions':
        navigate('/transactions');
        break;
      case 'bill-payments':
        navigate('/bill-payments');
        break;
      default:
        break;
    }
  }, [navigate]);

  const handleSignOut = useCallback(async () => {
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
  }, [signOut, navigate, toast]);

  if (isLoading) {
    return <MobileLoadingSkeleton />;
  }

  return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 overflow-hidden">
      {/* Professional Mobile Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-0.5">
        <div className="bg-white rounded-b-3xl">
          <div className="p-3 sm:p-5 space-y-3 sm:space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl sm:rounded-2xl">
                  <Crown className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-base sm:text-2xl font-bold text-gray-800">Espace Utilisateur</h1>
                  <p className="text-gray-600 text-sm sm:text-base">Dashboard personnel</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <NotificationSystem />
                <Button 
                  variant="ghost" 
                  size="lg" 
                  onClick={onRefresh}
                  disabled={isLoading}
                  className="p-2.5 sm:p-3.5 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="lg" 
                  onClick={handleSignOut}
                  className="p-2.5 sm:p-3.5 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            </div>
            
            {/* User Info Section */}
            <div className="flex items-center justify-between p-4 sm:p-5 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl sm:rounded-2xl">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-base sm:text-xl font-bold flex-shrink-0">
                  {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-xl font-bold text-gray-800 truncate">{userProfile?.full_name || 'Utilisateur'}</h2>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-gray-600 text-sm sm:text-base">
                    <span className="truncate">{userProfile?.phone || 'Téléphone non disponible'}</span>
                    {userProfile?.country && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span className="truncate">{userProfile.country}</span>
                      </>
                    )}
                  </div>
                  {userProfile?.address && (
                    <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                      <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full flex-shrink-0"></div>
                      <span className="truncate">{userProfile.address}</span>
                    </div>
                  )}
                </div>
              </div>
              {userProfile?.is_verified && (
                <div className="p-2 sm:p-2.5 bg-green-500 rounded-full flex-shrink-0">
                  <Star className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gorgeous Content */}
      <div className="p-3 sm:p-5 space-y-5 sm:space-y-7 pb-20 max-w-full">
        {/* Stunning Balance Card with User Info */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-5 sm:p-7 rounded-2xl text-white shadow-2xl">
            <div className="space-y-4 sm:space-y-5">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-white/80 text-sm sm:text-base mb-1">
                    Solde disponible
                  </h3>
                  <div className="text-sm sm:text-base text-white/70">
                    👤 <span className="truncate inline-block max-w-[150px] sm:max-w-none">{userProfile?.full_name || 'Utilisateur'}</span>
                    {userProfile?.address && (
                      <div className="mt-0.5 truncate">📍 {userProfile.address}</div>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-white/80 hover:text-white transition-colors p-2 flex-shrink-0"
                  aria-label={showBalance ? "Masquer le solde" : "Afficher le solde"}
                >
                  {showBalance ? <EyeOff size={18} className="sm:w-[20px] sm:h-[20px]" /> : <Eye size={18} className="sm:w-[20px] sm:h-[20px]" />}
                </button>
              </div>
              
              <div className="text-center">
                <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-yellow-200 to-yellow-400 bg-clip-text text-transparent break-all">
                  {showBalance ? formatCurrency(convertedBalance, userCurrency) : "••••••"}
                </p>
              </div>
              
              <div className="flex justify-center space-x-2">
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white/60 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white/40 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white/60 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Beautiful Actions */}
        <div className="grid grid-cols-2 gap-4 sm:gap-5 max-w-full">
          {[
            { key: 'transfer', icon: ArrowUpRight, label: 'Transférer', colors: 'from-pink-500 to-purple-500', bg: 'from-pink-600 to-purple-600' },
            { key: 'qr-code', icon: QrCode, label: 'Mon QR', colors: 'from-green-500 to-teal-500', bg: 'from-green-600 to-teal-600' },
            { key: 'qr-payment', icon: Scan, label: 'Payer QR', colors: 'from-indigo-500 to-purple-500', bg: 'from-indigo-600 to-purple-600' },
            { key: 'savings', icon: PiggyBank, label: 'Épargnes', colors: 'from-emerald-500 to-green-500', bg: 'from-emerald-600 to-green-600' },
            { key: 'transactions', icon: History, label: 'Historique', colors: 'from-orange-500 to-red-500', bg: 'from-orange-600 to-red-600' },
            { key: 'bill-payments', icon: Zap, label: 'Factures', colors: 'from-yellow-500 to-amber-500', bg: 'from-yellow-600 to-amber-600' },
          ].map(({ key, icon: Icon, label, colors, bg }) => (
            <div key={key} className="group relative">
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${bg} rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-500`}></div>
              <button
                onClick={() => handleAction(key)}
                className="relative w-full h-20 sm:h-24 bg-white rounded-xl flex flex-col items-center justify-center gap-2 sm:gap-3 shadow-lg hover:scale-105 transition-transform duration-300"
              >
                <div className={`p-2 sm:p-2.5 bg-gradient-to-r ${colors} rounded-full min-w-[36px] min-h-[36px] flex items-center justify-center`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span className="text-sm sm:text-base font-medium truncate px-1">{label}</span>
              </button>
            </div>
          ))}
        </div>

        {/* Attractive Tips */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3 sm:p-4 rounded-xl border-l-4 border-l-indigo-500 max-w-full">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <div className="p-1 sm:p-1.5 bg-indigo-100 rounded-full flex-shrink-0">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-indigo-900 text-xs sm:text-sm">Conseils</h3>
          </div>
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-indigo-500 rounded-full flex-shrink-0"></div>
              <p className="text-xs text-indigo-700">QR Code pour les retraits</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-purple-500 rounded-full flex-shrink-0"></div>
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