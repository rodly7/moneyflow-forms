
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    // If user is not logged in and not currently loading, redirect to auth page
    if (!user && !loading) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Show loading spinner while checking auth status
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
    </div>;
  }

  // Don't render anything if user is not logged in
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen w-full">
      {children}
    </div>
  );
};

export default Layout;
