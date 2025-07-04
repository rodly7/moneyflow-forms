import { useEffect, useCallback, useMemo, useRef, useState } from 'react';

/**
 * Hook pour débouncer les fonctions et éviter les appels excessifs
 */
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback as T;
};

/**
 * Hook pour throttler les fonctions et limiter la fréquence d'exécution
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCallTime = useRef<number>(0);
  
  const throttledCallback = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCallTime.current >= delay) {
      lastCallTime.current = now;
      return callback(...args);
    }
  }, [callback, delay]);

  return throttledCallback as T;
};

/**
 * Hook pour mémoriser les calculs coûteux
 */
export const useExpensiveCalculation = <T>(
  calculate: () => T,
  dependencies: React.DependencyList
): T => {
  return useMemo(calculate, dependencies);
};

/**
 * Hook pour observer les performances et optimiser automatiquement
 */
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    renderCount.current += 1;
    const endTime = Date.now();
    const renderTime = endTime - startTime.current;
    
    // Log des performances en mode développement
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 ${componentName} - Render ${renderCount.current} - Time: ${renderTime}ms`);
      
      // Avertir si le composant se re-render trop souvent
      if (renderCount.current > 10) {
        console.warn(`⚠️ ${componentName} a été rendu ${renderCount.current} fois. Considérez l'optimisation.`);
      }
      
      // Avertir si le render prend trop de temps
      if (renderTime > 100) {
        console.warn(`⚠️ ${componentName} prend ${renderTime}ms à rendre. Considérez l'optimisation.`);
      }
    }
    
    startTime.current = Date.now();
  });

  return {
    renderCount: renderCount.current,
    resetCounter: () => { renderCount.current = 0; }
  };
};

/**
 * Hook pour gérer la pagination et le chargement par batch
 */
export const usePagination = <T>(
  data: T[],
  itemsPerPage: number = 10
) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);
  
  const totalPages = Math.ceil(data.length / itemsPerPage);
  
  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);
  
  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);
  
  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);
  
  return {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
};

/**
 * Hook pour les requêtes en arrière-plan (prefetching)
 */
export const usePrefetch = (
  prefetchFn: () => Promise<any>,
  condition: boolean = true
) => {
  useEffect(() => {
    if (condition) {
      // Précharger après un délai pour ne pas bloquer le rendu initial
      const timeoutId = setTimeout(() => {
        prefetchFn().catch(error => {
          console.warn('Prefetch failed:', error);
        });
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [prefetchFn, condition]);
};