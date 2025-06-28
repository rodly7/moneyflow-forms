
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

  const refreshProfile = async () => {
    if (user?.id) {
      try {
        const profileData = await profileOptimizationService.getProfile(user.id, true);
        setProfile(profileData);
      } catch (error) {
        console.error('❌ Erreur lors du rafraîchissement du profil:', error);
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
          setUser(session.user);
          
          try {
            const profileData = await profileOptimizationService.getProfile(session.user.id);
            if (mounted) setProfile(profileData);
          } catch (error) {
            console.error('❌ Profile fetch error:', error);
          }
        }
        
        if (mounted) setLoading(false);
      } catch (error) {
        console.error('❌ Auth init error:', error);
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setProfile(null);
        profileOptimizationService.clearCache();
        return;
      }
      
      if (session?.user) {
        setUser(session.user);
        
        try {
          const profileData = await profileOptimizationService.getProfile(session.user.id);
          if (mounted) setProfile(profileData);
        } catch (error) {
          console.error('❌ Profile fetch after auth change:', error);
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
      await authService.signIn(phone, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (phone: string, password: string, metadata: SignUpMetadata) => {
    setLoading(true);
    try {
      await authService.signUp(phone, password, metadata);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    await authService.signOut();
    profileOptimizationService.clearCache();
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
