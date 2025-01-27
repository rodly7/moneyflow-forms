import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  signIn: (phone: string, password: string) => Promise<void>;
  signUp: (phone: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const formatPhoneToEmail = (phone: string) => {
    // Remove any non-digit characters and spaces
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return `${cleanPhone}@sendflow.com`;
  };

  const signIn = async (phone: string, password: string) => {
    const email = formatPhoneToEmail(phone);
    console.log("Trying to sign in with email:", email); // Debug log
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    navigate("/");
  };

  const signUp = async (phone: string, password: string) => {
    const email = formatPhoneToEmail(phone);
    console.log("Trying to sign up with email:", email); // Debug log
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          phone: phone, // Store the original phone number in metadata
        }
      }
    });
    if (error) throw error;
    navigate("/auth");
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ session, user, signIn, signUp, signOut }}>
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