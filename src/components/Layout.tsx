
import React from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Layout = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    console.log('🔍 Layout useEffect - État actuel:', {
      user: !!user,
      profile: profile,
      profileRole: profile?.role,
      loading,
      currentPath: location.pathname
    });

    // Don't do anything while loading
    if (loading) {
      console.log('⏳ Chargement en cours, attente...');
      return;
    }

    // Allow access to auth pages without being logged in
    if (location.pathname === '/auth' || location.pathname === '/agent-auth') {
      // Si l'utilisateur est connecté et sur une page d'auth, rediriger immédiatement
      if (user && profile) {
        console.log('🔄 Utilisateur connecté sur page auth, redirection immédiate basée sur le rôle:', profile.role);
        const targetPath = profile.role === 'agent' ? '/agent-dashboard' : '/';
        console.log('🎯 Redirection vers:', targetPath);
        navigate(targetPath, { replace: true });
      }
      return;
    }

    // If user is not logged in and not on auth pages, redirect to auth
    if (!user) {
      console.log('🔐 Utilisateur non connecté, redirection vers /auth');
      navigate('/auth');
      return;
    }

    // If user is logged in but profile is not loaded yet, wait
    if (user && !profile) {
      console.log('⏳ Utilisateur connecté mais profil en cours de chargement...');
      return;
    }

    // Redirect based on user role and current path
    if (user && profile) {
      console.log('👤 Profil chargé avec rôle:', profile.role);
      
      if (profile.role === 'agent') {
        // Agent should be on agent-dashboard or agent-specific pages
        const agentPages = ['/agent-dashboard', '/agent-services', '/agent-withdrawal', '/commission', '/verify-identity'];
        const isOnAgentPage = agentPages.some(page => location.pathname.startsWith(page));
        
        if (!isOnAgentPage) {
          console.log('🏢 Agent pas sur page agent, redirection FORCÉE vers agent-dashboard');
          navigate('/agent-dashboard', { replace: true });
        } else {
          console.log('🏢 Agent sur page autorisée:', location.pathname);
        }
      } else {
        // Regular user should NOT be on agent pages
        const agentPages = ['/agent-dashboard', '/agent-services', '/agent-withdrawal'];
        const isOnAgentPage = agentPages.some(page => location.pathname.startsWith(page));
        
        if (isOnAgentPage) {
          console.log('👤 Utilisateur normal sur page agent, redirection vers accueil');
          navigate('/', { replace: true });
        }
      }
    }
  }, [user, profile, loading, navigate, location.pathname]);

  // Show loading spinner while checking auth status
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
    </div>;
  }

  // Allow auth pages to render even if user is not logged in
  if (location.pathname === '/auth' || location.pathname === '/agent-auth') {
    return (
      <div className="min-h-screen w-full">
        <Outlet />
      </div>
    );
  }

  // Don't render anything if user is not logged in and we're not on auth pages
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
