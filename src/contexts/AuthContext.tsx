
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  full_name: string | null;
  phone: string;
  country: string | null;
  address: string | null;
  balance: number;
  role: 'user' | 'agent' | 'admin';
  avatar_url: string | null;
  is_verified: boolean | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  userRole: 'user' | 'agent' | 'admin' | null;
  loading: boolean;
  signIn: (phone: string, password: string) => Promise<void>;
  signUp: (phone: string, password: string, metadata: any) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
  isAgent: () => boolean;
  isAgentOrAdmin: () => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fonction pour normaliser le format du numéro de téléphone
const normalizePhoneNumber = (phone: string): string => {
  // Supprimer tous les espaces et caractères spéciaux sauf le +
  let cleanPhone = phone.replace(/[^\d+]/g, '');
  
  // S'assurer que le numéro commence par +
  if (!cleanPhone.startsWith('+')) {
    // Si le numéro ne commence pas par +, on assume que c'est un numéro local
    // et on ajoute un code pays par défaut (vous pouvez ajuster selon vos besoins)
    cleanPhone = '+' + cleanPhone;
  }
  
  console.log('📱 Numéro normalisé:', cleanPhone);
  return cleanPhone;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
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
  };

  const refreshProfile = async () => {
    if (user?.id) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔐 Session initiale:', session ? 'Connecté' : 'Non connecté');
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Changement d\'authentification:', event, session ? 'Utilisateur connecté' : 'Utilisateur déconnecté');
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const profileData = await fetchProfile(session.user.id);
        setProfile(profileData);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (phone: string, password: string) => {
    try {
      console.log('🔐 Tentative de connexion avec le numéro:', phone);
      
      // Normaliser le numéro de téléphone
      const normalizedPhone = normalizePhoneNumber(phone);
      const email = `${normalizedPhone}@sendflow.app`;
      
      console.log('📧 Email généré pour la connexion:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password,
      });

      if (error) {
        console.error('❌ Erreur de connexion:', error);
        throw error;
      }
      
      console.log('✅ Connexion réussie:', data.user?.id);
    } catch (error) {
      console.error('❌ Erreur dans signIn:', error);
      throw error;
    }
  };

  const signUp = async (phone: string, password: string, metadata: any) => {
    try {
      console.log('📝 Inscription avec le numéro:', phone);
      console.log('📋 Métadonnées:', metadata);
      
      // Normaliser le numéro de téléphone
      const normalizedPhone = normalizePhoneNumber(phone);
      const email = `${normalizedPhone}@sendflow.app`;
      
      console.log('📧 Email généré pour l\'inscription:', email);
      
      // Déterminer le rôle basé sur les métadonnées
      const userRole = metadata.role === 'agent' ? 'agent' : 'user';
      
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password,
        options: {
          data: {
            ...metadata,
            phone: normalizedPhone, // Stocker le numéro normalisé
            role: userRole,
          },
        },
      });

      if (error) {
        console.error('❌ Erreur d\'inscription:', error);
        throw error;
      }
      
      console.log('✅ Inscription réussie:', data.user?.id);
    } catch (error) {
      console.error('❌ Erreur dans signUp:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  const isAdmin = () => {
    return profile?.role === 'admin';
  };

  const isAgent = () => {
    return profile?.role === 'agent';
  };

  const isAgentOrAdmin = () => {
    return profile?.role === 'agent' || profile?.role === 'admin';
  };

  // Compute userRole from profile
  const userRole = profile?.role || null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        userRole,
        loading,
        signIn,
        signUp,
        signOut,
        isAdmin,
        isAgent,
        isAgentOrAdmin,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
