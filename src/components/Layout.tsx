
import React from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Layout = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (loading) return;

    // Pages d'authentification - pas de redirection si déjà connecté
    if (location.pathname === '/auth' || location.pathname === '/agent-auth') {
      return;
    }

    // Redirection vers auth si pas connecté
    if (!user) {
      navigate('/auth');
      return;
    }

    // Attendre le profil si pas encore chargé
    if (user && !profile) return;

    // Redirection basée sur le rôle - seulement si pas déjà sur la bonne page
    if (user && profile) {
      const isMainAdmin = profile.phone === '+221773637752';
      const isSubAdmin = profile.role === 'sub_admin';
      const isAgent = profile.role === 'agent';

      if (isMainAdmin && !location.pathname.startsWith('/main-admin')) {
        navigate('/main-admin', { replace: true });
      } else if (isSubAdmin && !location.pathname.startsWith('/sub-admin')) {
        navigate('/sub-admin', { replace: true });
      } else if (isAgent && !location.pathname.startsWith('/agent-dashboard') && !location.pathname.startsWith('/agent-services') && !location.pathname.startsWith('/commission') && !location.pathname.startsWith('/verify-identity') && !location.pathname.startsWith('/deposit-withdrawal')) {
        navigate('/agent-dashboard', { replace: true });
      } else if (!isMainAdmin && !isSubAdmin && !isAgent && (location.pathname === '/' || location.pathname.startsWith('/agent-') || location.pathname.startsWith('/main-admin') || location.pathname.startsWith('/sub-admin'))) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, profile, loading, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (location.pathname === '/auth' || location.pathname === '/agent-auth') {
    return <div className="min-h-screen w-full"><Outlet /></div>;
  }

  if (!user || !profile) {
    return null;
  }

  return <div className="min-h-screen w-full"><Outlet /></div>;
};

export default Layout;
