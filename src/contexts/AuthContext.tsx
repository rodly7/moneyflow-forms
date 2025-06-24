
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Profile, AuthContextType, SignUpMetadata } from '@/types/auth';
import { authService } from '@/services/authService';
import { profileService } from '@/services/profileService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const refreshProfile = async () => {
    if (user?.id) {
      const profileData = await profileService.fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔐 Session initiale:', session ? 'Connecté' : 'Non connecté');
      setUser(session?.user ?? null);
      if (session?.user) {
        profileService.fetchProfile(session.user.id).then(setProfile);
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
        const profileData = await profileService.fetchProfile(session.user.id);
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
      await authService.signIn(phone, password);
    } catch (error) {
      console.error('❌ Erreur dans signIn:', error);
      throw error;
    }
  };

  const signUp = async (phone: string, password: string, metadata: SignUpMetadata) => {
    try {
      await authService.signUp(phone, password, metadata);
    } catch (error) {
      console.error('❌ Erreur dans signUp:', error);
      throw error;
    }
  };

  const signOut = async () => {
    await authService.signOut();
  };

  const isAdmin = () => profileService.isAdmin(profile);
  const isAgent = () => profileService.isAgent(profile);
  const isAgentOrAdmin = () => profileService.isAgentOrAdmin(profile);

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
