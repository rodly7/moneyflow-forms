
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
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
    const { error } = await supabase.auth.signInWithPassword({
      email: `${phone}@sendflow.app`,
      password,
    });

    if (error) {
      throw error;
    }
  };

  const signUp = async (phone: string, password: string, metadata: any) => {
    // Determine role based on metadata
    const userRole = metadata.role === 'agent' ? 'agent' : 'user';
    
    const { error } = await supabase.auth.signUp({
      email: `${phone}@sendflow.app`,
      password,
      options: {
        data: {
          ...metadata,
          role: userRole,
        },
      },
    });

    if (error) {
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
