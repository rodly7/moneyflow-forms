
import { supabase } from '@/integrations/supabase/client';

class ProfileOptimizationService {
  private profileCache = new Map<string, { data: any, timestamp: number }>();
  private readonly CACHE_DURATION = 60 * 1000; // 1 minute

  async getProfile(userId: string, forceRefresh = false) {
    const cacheKey = `profile_${userId}`;
    const cached = this.profileCache.get(cacheKey);
    
    // Utiliser le cache si disponible et pas expiré
    if (!forceRefresh && cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      // Mettre en cache
      this.profileCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du profil:', error);
      throw error;
    }
  }

  clearCache(userId?: string) {
    if (userId) {
      this.profileCache.delete(`profile_${userId}`);
    } else {
      this.profileCache.clear();
    }
  }
}

export const profileOptimizationService = new ProfileOptimizationService();
