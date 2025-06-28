
import React from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Layout = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (loading) return;

    // Pages d'authentification
    if (location.pathname === '/auth' || location.pathname === '/agent-auth') {
      return;
    }

    // Si pas d'utilisateur connecté, rediriger vers auth
    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    // Si utilisateur mais pas de profil encore, attendre
    if (!profile) {
      return;
    }

    // Redirections basées sur le rôle
    const isMainAdmin = profile.phone === '+221773637752';
    const isSubAdmin = profile.role === 'sub_admin';
    const isAgent = profile.role === 'agent';
    const isUser = profile.role === 'user';

    // Redirection selon le rôle si on est sur la page d'accueil
    if (location.pathname === '/') {
      if (isMainAdmin) {
        navigate('/main-admin', { replace: true });
      } else if (isSubAdmin) {
        navigate('/sub-admin', { replace: true });
      } else if (isAgent) {
        navigate('/agent-dashboard', { replace: true });
      } else if (isUser) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, profile, loading, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  // Pages d'authentification
  if (location.pathname === '/auth' || location.pathname === '/agent-auth') {
    return <div className="min-h-screen w-full"><Outlet /></div>;
  }

  // Si pas d'utilisateur ou de profil, ne rien afficher (redirection en cours)
  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen w-full">
      <Outlet />
    </div>
  );
};

export default Layout;
