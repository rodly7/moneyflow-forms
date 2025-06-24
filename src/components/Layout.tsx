
import React from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Layout = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    // If user is authenticated and on auth page, redirect based on role
    if (user && profile && location.pathname === '/auth') {
      if (profile.role === 'agent') {
        navigate('/agent-dashboard');
      } else {
        navigate('/');
      }
      return;
    }

    // Don't redirect if we're already on the auth page
    if (location.pathname === '/auth') {
      return;
    }

    // If user is not logged in and not currently loading, redirect to auth page
    if (!user && !loading) {
      navigate('/auth');
    }

    // Redirect agents to their specific dashboard if they're on the regular home page
    if (user && profile && profile.role === 'agent' && location.pathname === '/') {
      navigate('/agent-dashboard');
    }
  }, [user, profile, loading, navigate, location.pathname]);

  // Show loading spinner while checking auth status
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
    </div>;
  }

  // Allow auth page to render even if user is not logged in
  if (location.pathname === '/auth') {
    return (
      <div className="min-h-screen w-full">
        <Outlet />
      </div>
    );
  }

  // Don't render anything if user is not logged in and we're not on auth page
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen w-full">
      <Outlet />
    </div>
  );
};

export default Layout;
