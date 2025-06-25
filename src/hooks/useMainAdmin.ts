
import { useAuth } from "@/contexts/AuthContext";

export const useMainAdmin = () => {
  const { profile } = useAuth();
  
  const isMainAdmin = () => {
    return profile?.phone === '+221773637752';
  };

  return {
    isMainAdmin: isMainAdmin()
  };
};
