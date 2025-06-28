
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile, AuthContextType, SignUpMetadata } from '@/types/auth';
import { authService } from '@/services/authService';
import { profileService } from '@/services/profileService';
import { profileOptimizationService } from '@/services/profileOptimizationService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  console.log('🔐 AuthProvider - État:', { user: !!user, profile: !!profile, loading });

  const refreshProfile = async () => {
    if (user?.id) {
      try {
        console.log('🔄 Rafraîchissement du profil pour:', user.id);
        const profileData = await profileOptimizationService.getProfile(user.id, true);
        setProfile(profileData);
        console.log('✅ Profil rafraîchi:', profileData);
      } catch (error) {
        console.error('❌ Erreur lors du rafraîchissement du profil:', error);
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('🚀 Initialisation de l\'authentification');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erreur session:', error);
          if (mounted) setLoading(false);
          return;
        }

        console.log('📋 Session:', session ? 'Trouvée' : 'Aucune');
        
        if (session?.user && mounted) {
          console.log('👤 Utilisateur trouvé:', session.user.id);
          setUser(session.user);
          
          try {
            const profileData = await profileOptimizationService.getProfile(session.user.id);
            if (mounted) {
              setProfile(profileData);
              console.log('📊 Profil chargé:', profileData);
            }
          } catch (error) {
            console.error('❌ Erreur profil:', error);
          }
        }
        
        if (mounted) setLoading(false);
      } catch (error) {
        console.error('❌ Erreur init auth:', error);
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('🔐 Changement auth:', event);
      
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setProfile(null);
        profileOptimizationService.clearCache();
        setLoading(false);
        return;
      }
      
      if (session?.user) {
        setUser(session.user);
        
        try {
          const profileData = await profileOptimizationService.getProfile(session.user.id);
          if (mounted) {
            setProfile(profileData);
            console.log('📊 Profil mis à jour:', profileData);
          }
        } catch (error) {
          console.error('❌ Erreur profil après auth change:', error);
        }
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (phone: string, password: string) => {
    setLoading(true);
    try {
      console.log('🔑 Tentative de connexion:', phone);
      await authService.signIn(phone, password);
    } catch (error) {
      console.error('❌ Erreur signIn:', error);
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (phone: string, password: string, metadata: SignUpMetadata) => {
    setLoading(true);
    try {
      console.log('📝 Tentative d\'inscription:', phone);
      await authService.signUp(phone, password, metadata);
    } catch (error) {
      console.error('❌ Erreur signUp:', error);
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('🚪 Déconnexion');
    try {
      await authService.signOut();
      profileOptimizationService.clearCache();
    } catch (error) {
      console.error('❌ Erreur signOut:', error);
      throw error;
    }
  };

  const isAdmin = () => profileService.isAdmin(profile);
  const isAgent = () => profileService.isAgent(profile);
  const isAgentOrAdmin = () => profileService.isAgentOrAdmin(profile);
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
