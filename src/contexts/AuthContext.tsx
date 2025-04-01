
import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type UserMetadata = {
  full_name?: string;
  country?: string;
  address?: string;
  phone?: string;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean; // Add loading property to the interface
  signIn: (phone: string, password: string) => Promise<void>;
  signUp: (phone: string, password: string, metadata?: UserMetadata) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Add loading state
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session:", session);
      if (session) {
        setSession(session);
        setUser(session.user);
        // Only navigate to home if we're on the auth page
        if (window.location.pathname === "/auth") {
          navigate("/");
        }
      } else {
        // Clear session and user state
        setSession(null);
        setUser(null);
        // Only redirect to auth if we're not already there
        if (window.location.pathname !== "/auth") {
          navigate("/auth");
        }
      }
      setLoading(false); // Set loading to false once we've checked the session
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("Auth state changed:", _event, session);
      
      if (session) {
        setSession(session);
        setUser(session.user);
        
        // Only navigate to home if we're on the auth page
        if (window.location.pathname === "/auth") {
          navigate("/");
        }
      } else {
        setSession(null);
        setUser(null);
        // Only redirect to auth if we're not already there
        if (window.location.pathname !== "/auth") {
          navigate("/auth");
        }
      }
      setLoading(false); // Ensure loading is set to false after auth state changes
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const formatPhoneToEmail = (phone: string) => {
    // Nettoyer le numéro de téléphone pour ne garder que les chiffres
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return `${cleanPhone}@sendflow.com`;
  };

  const signIn = async (phone: string, password: string) => {
    const email = formatPhoneToEmail(phone);
    console.log("Trying to sign in with email:", email);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      toast.success("Connexion réussie");
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast.error(error.message);
      throw error;
    }
  };

  const signUp = async (phone: string, password: string, metadata?: UserMetadata) => {
    const email = formatPhoneToEmail(phone);
    console.log("Trying to sign up with email:", email);
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...metadata,
            phone: phone,
          }
        }
      });
      
      if (error) throw error;
      
      toast.success("Compte créé avec succès");
      navigate("/auth");
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast.error(error.message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setSession(null);
      setUser(null);
      
      toast.success("Déconnexion réussie");
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error(error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
