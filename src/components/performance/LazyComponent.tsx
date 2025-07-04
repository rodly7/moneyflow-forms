import { lazy, Suspense, ComponentType, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface LazyLoadProps {
  children: ReactNode;
  fallback?: ReactNode;
}

// Composant de chargement optimisé
const OptimizedLoader = () => (
  <Card className="w-full shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-pulse">
    <CardContent className="pt-8 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 text-sm font-medium">Chargement...</p>
    </CardContent>
  </Card>
);

// HOC pour le lazy loading avec gestion d'erreur
export const withLazyLoading = <P extends object>(
  Component: ComponentType<P>,
  fallback?: ReactNode
) => {
  const LazyComponent = lazy(() => 
    Promise.resolve({ default: Component }).catch(() => ({
      default: () => (
        <div className="text-center p-4 text-red-600">
          Erreur de chargement du composant
        </div>
      )
    }))
  );

  return (props: P) => (
    <Suspense fallback={fallback || <OptimizedLoader />}>
      <LazyComponent {...(props as any)} />
    </Suspense>
  );
};

// Wrapper pour les sections qui peuvent être chargées de manière différée
export const LazySection = ({ children, fallback }: LazyLoadProps) => (
  <Suspense fallback={fallback || <OptimizedLoader />}>
    {children}
  </Suspense>
);

// Hook pour le lazy loading conditionnel
export const useLazyLoad = (condition: boolean) => {
  return condition;
};