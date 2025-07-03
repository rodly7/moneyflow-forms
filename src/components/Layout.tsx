
import React from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Layout = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Déterminer la classe de thème basée sur le rôle
  const getThemeClass = () => {
    if (!profile) return '';
    switch (profile.role) {
      case 'admin':
        return 'admin-theme';
      case 'sub_admin':
        return 'sub-admin-theme';
      case 'agent':
        return 'agent-theme';
      default:
        return 'user-theme';
    }
  };

  React.useEffect(() => {
    if (loading) {
      return;
    }

    // Pages publiques qui ne nécessitent pas d'authentification
    const publicPaths = ['/', '/auth', '/agent-auth'];
    
    if (publicPaths.includes(location.pathname)) {
      // Si l'utilisateur est connecté et sur une page publique, rediriger vers le dashboard approprié
      if (user && profile) {
        if (profile.role === 'admin') {
          navigate('/admin-dashboard', { replace: true });
        } else if (profile.role === 'sub_admin') {
          navigate('/sub-admin-dashboard', { replace: true });
        } else if (profile.role === 'agent') {
          navigate('/agent-dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
      return;
    }

    // Pour les pages protégées, vérifier l'authentification
    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    // Si l'utilisateur existe mais pas de profil, attendre
    if (!profile) {
      return;
    }

  }, [user, profile, loading, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 animate-fade-in">
        <div className="text-center glass p-8 rounded-3xl shadow-2xl backdrop-blur-lg">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-6 shadow-lg"></div>
          <p className="text-blue-600 font-semibold text-lg">✨ Chargement de votre espace...</p>
          <p className="text-blue-500 text-sm mt-2">Préparation de l'interface</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full ${getThemeClass()}`}>
      <Outlet />
    </div>
  );
};

export default Layout;
