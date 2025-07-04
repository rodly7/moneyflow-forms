import { memo, Suspense, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { usePerformanceMonitor } from "@/hooks/usePerformanceOptimization";
import { LazySection } from "@/components/performance/LazyComponent";

// Composants optimisés avec lazy loading
const OptimizedBalanceCard = memo(() => {
  return (
    <LazySection>
      <Card className="animate-fade-in">
        <CardContent className="p-6">
          <div className="h-32 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">Solde optimisé</span>
          </div>
        </CardContent>
      </Card>
    </LazySection>
  );
});

const OptimizedTransactionsList = memo(() => {
  return (
    <LazySection>
      <Card className="animate-fade-in">
        <CardContent className="p-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    </LazySection>
  );
});

const OptimizedActionButtons = memo(() => {
  return (
    <LazySection>
      <div className="grid grid-cols-2 gap-4 animate-fade-in">
        {['Transférer', 'QR Code', 'Épargnes', 'Historique'].map((action) => (
          <button
            key={action}
            className="h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform duration-200"
          >
            {action}
          </button>
        ))}
      </div>
    </LazySection>
  );
});

const LoadingFallback = memo(() => (
  <Card className="animate-pulse">
    <CardContent className="p-6">
      <div className="h-32 bg-gray-200 rounded-lg"></div>
    </CardContent>
  </Card>
));

interface OptimizedDashboardProps {
  userBalance: number;
  userCountry: string;
}

const OptimizedDashboard = memo(({ userBalance, userCountry }: OptimizedDashboardProps) => {
  const { profile } = useAuth();
  const { renderCount } = usePerformanceMonitor('OptimizedDashboard');

  // Mémoriser les calculs coûteux
  const dashboardConfig = useMemo(() => ({
    showBalance: true,
    showTransactions: true,
    showActions: true,
    animationDelay: renderCount > 1 ? 0 : 200, // Pas d'animation après le premier rendu
  }), [renderCount]);

  if (!profile) {
    return <LoadingFallback />;
  }

  return (
    <div className="space-y-6 p-4">
      {/* Section Solde - Priorité haute */}
      {dashboardConfig.showBalance && (
        <Suspense fallback={<LoadingFallback />}>
          <OptimizedBalanceCard />
        </Suspense>
      )}

      {/* Section Actions - Priorité moyenne */}
      {dashboardConfig.showActions && (
        <Suspense fallback={<div className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>}>
          <OptimizedActionButtons />
        </Suspense>
      )}

      {/* Section Transactions - Priorité basse */}
      {dashboardConfig.showTransactions && (
        <Suspense fallback={<div className="h-48 bg-gray-100 rounded-xl animate-pulse"></div>}>
          <OptimizedTransactionsList />
        </Suspense>
      )}

      {/* Debug info en développement */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-xs">
          Renders: {renderCount}
        </div>
      )}
    </div>
  );
});

OptimizedDashboard.displayName = 'OptimizedDashboard';
OptimizedBalanceCard.displayName = 'OptimizedBalanceCard';
OptimizedTransactionsList.displayName = 'OptimizedTransactionsList';
OptimizedActionButtons.displayName = 'OptimizedActionButtons';
LoadingFallback.displayName = 'LoadingFallback';

export default OptimizedDashboard;