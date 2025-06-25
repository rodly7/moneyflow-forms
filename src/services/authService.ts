
import { supabase } from '@/integrations/supabase/client';
import { SignUpMetadata } from '@/types/auth';

export const authService = {
  async signIn(phone: string, password: string) {
    console.log('🔐 Tentative de connexion avec le numéro:', phone);
    
    // Normaliser le numéro de téléphone pour la connexion
    const normalizedPhone = phone.replace(/[^\d+]/g, '');
    const email = `${normalizedPhone}@sendflow.app`;
    console.log('📧 Email de connexion généré:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password,
    });

    if (error) {
      console.error('❌ Erreur de connexion:', error);
      
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Numéro de téléphone ou mot de passe incorrect. Vérifiez que vous utilisez le même format qu\'à l\'inscription.');
      }
      
      throw new Error('Numéro de téléphone ou mot de passe incorrect. Vérifiez vos informations.');
    }
    
    console.log('✅ Connexion réussie pour:', data.user?.id);
  },

  async signUp(phone: string, password: string, metadata: SignUpMetadata) {
    console.log('📝 Tentative d\'inscription avec le numéro:', phone);
    console.log('🎯 Rôle demandé:', metadata.role);
    
    // Normaliser le numéro de téléphone pour l'inscription
    const normalizedPhone = phone.replace(/[^\d+]/g, '');
    const email = `${normalizedPhone}@sendflow.app`;
    console.log('📧 Email d\'inscription généré:', email);
    
    const userRole = metadata.role === 'agent' ? 'agent' : 'user';
    console.log('👥 Rôle final assigné:', userRole);
    
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password,
      options: {
        data: {
          ...metadata,
          phone: normalizedPhone,  // Utiliser le numéro normalisé
          role: userRole,
        },
      },
    });

    if (error) {
      console.error('❌ Erreur d\'inscription:', error);
      if (error.message.includes('User already registered')) {
        throw new Error('Un compte existe déjà avec ce numéro de téléphone. Essayez de vous connecter.');
      }
      throw error;
    }
    
    console.log('✅ Inscription réussie:', data.user?.id);
    console.log('📋 Métadonnées utilisateur:', data.user?.user_metadata);
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }
};
