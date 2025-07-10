import { useUserSession } from '@/hooks/useUserSession';
import { useAuth } from '@/contexts/AuthContext';

const SessionManager = () => {
  const { user } = useAuth();
  
  // Gérer les sessions uniquement pour les utilisateurs connectés
  if (user) {
    useUserSession();
  }
  
  return null;
};

export default SessionManager;