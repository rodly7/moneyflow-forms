
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/auth';

export const profileService = {
  async fetchProfile(userId: string): Promise<Profile | null> {
    try {
      console.log('🔍 Récupération du profil pour l\'utilisateur:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Erreur lors de la récupération du profil:', error);
        return null;
      }

      console.log('✅ Profil récupéré:', data);
      return data;
    } catch (error) {
      console.error('❌ Erreur dans fetchProfile:', error);
      return null;
    }
  },

  isAdmin(profile: Profile | null): boolean {
    return profile?.role === 'admin';
  },

  isAgent(profile: Profile | null): boolean {
    return profile?.role === 'agent';
  },

  isAgentOrAdmin(profile: Profile | null): boolean {
    return profile?.role === 'agent' || profile?.role === 'admin';
  }
};
