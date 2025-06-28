
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile, AuthContextType, SignUpMetadata } from '@/types/auth';
import { authService } from '@/services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (user?.id) {
      try {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Erreur lors du rafraîchissement du profil:', error);
          return;
        }
        
        console.log('📊 Profil rafraîchi:', profileData);
        setProfile(profileData);
      } catch (error) {
        console.error('Erreur lors du rafraîchissement du profil:', error);
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('🔄 Initialisation de l\'authentification...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erreur lors de la récupération de la session:', error);
          if (mounted) setLoading(false);
          return;
        }
        
        if (session?.user && mounted) {
          console.log('👤 Utilisateur trouvé dans la session:', session.user.id);
          setUser(session.user);
          
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (!profileError && profileData && mounted) {
              console.log('📊 Profil chargé:', profileData);
              setProfile(profileData);
            } else {
              console.error('Erreur profil:', profileError);
            }
          } catch (error) {
            console.error('Erreur lors de la récupération du profil:', error);
          }
        } else {
          console.log('❌ Aucune session utilisateur trouvée');
        }
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('🔄 Changement d\'état auth:', event, session?.user?.id);
      
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      
      if (session?.user) {
        setUser(session.user);
        
        // Attendre un peu avant de charger le profil
        setTimeout(async () => {
          if (!mounted) return;
          try {
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (!error && profileData && mounted) {
              console.log('📊 Profil chargé après auth change:', profileData);
              setProfile(profileData);
            } else {
              console.error('Erreur profil après auth change:', error);
            }
          } catch (error) {
            console.error('Erreur lors de la récupération du profil après auth change:', error);
          }
          setLoading(false);
        }, 100);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (phone: string, password: string) => {
    try {
      setLoading(true);
      await authService.signIn(phone, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (phone: string, password: string, metadata: SignUpMetadata) => {
    try {
      setLoading(true);
      await authService.signUp(phone, password, metadata);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      throw error;
    }
  };

  const isAdmin = () => profile?.role === 'admin';
  const isAgent = () => profile?.role === 'agent';
  const isAgentOrAdmin = () => profile?.role === 'agent' || profile?.role === 'admin' || profile?.role === 'sub_admin';
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
