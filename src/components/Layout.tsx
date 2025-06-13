
import React from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Layout = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    // Don't redirect if we're already on the auth page
    if (location.pathname === '/auth') {
      return;
    }

    // If user is not logged in and not currently loading, redirect to auth page
    if (!user && !loading) {
      navigate('/auth');
    }
  }, [user, loading, navigate, location.pathname]);

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
