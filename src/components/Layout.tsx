
import React from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import AuthDiagnostic from './AuthDiagnostic';

const Layout = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  console.log('🔧 Layout - État:', { user: !!user, profile: !!profile, loading, pathname: location.pathname });

  React.useEffect(() => {
    if (loading) return;

    // Pages d'authentification - pas de redirection si déjà sur ces pages
    if (location.pathname === '/auth' || location.pathname === '/agent-auth') {
      return;
    }

    // Si pas d'utilisateur connecté, rediriger vers auth
    if (!user) {
      console.log('❌ Pas d\'utilisateur - redirection vers /auth');
      navigate('/auth', { replace: true });
      return;
    }

    // Si utilisateur mais pas de profil encore, attendre
    if (!profile) {
      console.log('⏳ Utilisateur sans profil - attente...');
      return;
    }

    // Redirections basées sur le rôle
    const isMainAdmin = profile.phone === '+221773637752';
    const isSubAdmin = profile.role === 'sub_admin';
    const isAgent = profile.role === 'agent';

    console.log('👤 Rôle utilisateur:', { isMainAdmin, isSubAdmin, isAgent, role: profile.role });

    // Rediriger selon le rôle uniquement si pas déjà sur la bonne page
    if (isMainAdmin && !location.pathname.startsWith('/main-admin')) {
      console.log('🔀 Redirection vers main-admin');
      navigate('/main-admin', { replace: true });
    } else if (isSubAdmin && !location.pathname.startsWith('/sub-admin')) {
      console.log('🔀 Redirection vers sub-admin');
      navigate('/sub-admin', { replace: true });
    } else if (isAgent && !location.pathname.startsWith('/agent-dashboard') && !location.pathname.startsWith('/agent-services') && !location.pathname.startsWith('/commission') && !location.pathname.startsWith('/verify-identity') && !location.pathname.startsWith('/deposit-withdrawal')) {
      console.log('🔀 Redirection vers agent-dashboard');
      navigate('/agent-dashboard', { replace: true });
    } else if (!isMainAdmin && !isSubAdmin && !isAgent && (location.pathname === '/' || location.pathname.startsWith('/main-admin') || location.pathname.startsWith('/sub-admin'))) {
      console.log('🔀 Redirection vers dashboard utilisateur normal');
      navigate('/dashboard', { replace: true });
    }
  }, [user, profile, loading, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Chargement...</p>
        </div>
        <AuthDiagnostic />
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
      <AuthDiagnostic />
    </div>
  );
};

export default Layout;
