
import { useAuth } from "@/contexts/AuthContext";

export const useSubAdmin = () => {
  const { profile } = useAuth();
  
  const isSubAdmin = () => {
    return profile?.role === 'sub_admin';
  };

  const canManageUsers = () => {
    // Les sous-admins ne peuvent pas supprimer, modifier les infos, bannir ou changer les rôles
    return false;
  };

  const canViewUsers = () => {
    // Les sous-admins peuvent seulement voir les utilisateurs
    return isSubAdmin();
  };

  const canRecharge = () => {
    // Les sous-admins ne peuvent pas faire de recharge
    return false;
  };

  const canDepositToAgent = () => {
    // Les sous-admins peuvent faire des dépôts agent
    return isSubAdmin();
  };

  return {
    isSubAdmin: isSubAdmin(),
    canManageUsers: canManageUsers(),
    canViewUsers: canViewUsers(),
    canRecharge: canRecharge(),
    canDepositToAgent: canDepositToAgent()
  };
};
