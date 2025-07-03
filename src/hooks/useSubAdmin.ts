
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
    // Les sous-admins peuvent voir tous les utilisateurs
    return isSubAdmin();
  };

  const canRecharge = () => {
    // Les sous-admins ne peuvent pas faire de recharge personnelle
    return false;
  };

  const canDepositToAgent = () => {
    // Les sous-admins peuvent faire des dépôts agent
    return isSubAdmin();
  };

  const canViewAllData = () => {
    // Les sous-admins peuvent voir toutes les données comme les admins
    return isSubAdmin();
  };

  return {
    isSubAdmin: isSubAdmin(),
    canManageUsers: canManageUsers(),
    canViewUsers: canViewUsers(),
    canRecharge: canRecharge(),
    canDepositToAgent: canDepositToAgent(),
    canViewAllData: canViewAllData()
  };
};
