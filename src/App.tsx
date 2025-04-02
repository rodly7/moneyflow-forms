
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Index from './pages/Index';
import Auth from './pages/Auth';
import Withdraw from './pages/Withdraw';
import QRCode from './pages/QRCode';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Receive from './pages/Receive';
import PrepaidCards from './pages/PrepaidCards';
import BillPayments from './pages/BillPayments';
import MobileRecharge from './pages/MobileRecharge';

import './App.css';

// Setup React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      networkMode: 'always',
    },
  },
});

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
    </div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" />;
  }
  
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            
            <Route path="/withdraw" element={
              <ProtectedRoute>
                <Withdraw />
              </ProtectedRoute>
            } />
            
            <Route path="/qrcode" element={
              <ProtectedRoute>
                <QRCode />
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/transactions" element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            } />

            <Route path="/receive" element={
              <ProtectedRoute>
                <Receive />
              </ProtectedRoute>
            } />
            
            <Route path="/prepaid-cards" element={
              <ProtectedRoute>
                <PrepaidCards />
              </ProtectedRoute>
            } />
            
            <Route path="/bill-payments" element={
              <ProtectedRoute>
                <BillPayments />
              </ProtectedRoute>
            } />
            
            <Route path="/mobile-recharge" element={
              <ProtectedRoute>
                <MobileRecharge />
              </ProtectedRoute>
            } />
          </Routes>
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
