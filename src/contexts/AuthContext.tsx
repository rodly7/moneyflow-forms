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
      console.log('🔄 Rafraîchissement du profil pour:', user.id);
      try {
        // Force refresh from database, bypass any caching
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('❌ Erreur lors du rafraîchissement du profil:', error);
          return;
        }
        
        console.log('📊 Profil rafraîchi depuis la base de données:', profileData);
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
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erreur lors de la récupération de la session:', error);
          setLoading(false);
          return;
        }

        console.log('🔐 Session initiale:', session ? 'Connecté' : 'Non connecté');
        
        if (session?.user && mounted) {
          console.log('👤 Utilisateur connecté:', session.user.id);
          setUser(session.user);
          
          // Fetch profile with retry logic - direct database query
          let retries = 3;
          while (retries > 0 && mounted) {
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if (profileError) {
                console.error('❌ Erreur base de données profil:', profileError);
                retries--;
                if (retries > 0) {
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
                continue;
              }
              
              if (profileData && mounted) {
                console.log('📊 Profil initial récupéré depuis la base:', profileData);
                setProfile(profileData);
                break;
              }
              retries--;
              if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            } catch (error) {
              console.error('❌ Erreur lors de la récupération du profil:', error);
              retries--;
              if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          }
        }
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de l\'auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('🔐 Changement d\'authentification:', event);
      
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      
      if (session?.user) {
        setUser(session.user);
        
        // Defer profile fetching to avoid blocking - direct database query
        setTimeout(async () => {
          if (!mounted) return;
          try {
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (error) {
              console.error('❌ Erreur base de données profil après auth change:', error);
            } else if (profileData && mounted) {
              console.log('📊 Profil récupéré après changement auth:', profileData);
              setProfile(profileData);
            }
          } catch (error) {
            console.error('❌ Erreur lors de la récupération du profil après auth change:', error);
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
      console.log('🔐 Tentative de connexion:', phone);
      setLoading(true);
      await authService.signIn(phone, password);
    } catch (error) {
      console.error('❌ Erreur dans signIn:', error);
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (phone: string, password: string, metadata: SignUpMetadata) => {
    try {
      console.log('📝 Tentative d\'inscription:', { phone, role: metadata.role });
      setLoading(true);
      await authService.signUp(phone, password, metadata);
    } catch (error) {
      console.error('❌ Erreur dans signUp:', error);
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    console.log('🚪 Déconnexion');
    try {
      await authService.signOut();
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
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
