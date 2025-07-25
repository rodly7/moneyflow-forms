import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Suspense, lazy, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

// Lazy load all pages for better performance
const Layout = lazy(() => import("./components/Layout"));
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const NewAgentDashboard = lazy(() => import("./pages/NewAgentDashboard"));
const MainAdminDashboard = lazy(() => import("./pages/MainAdminDashboard"));
const SubAdminDashboard = lazy(() => import("./pages/SubAdminDashboard"));
const Transfer = lazy(() => import("./pages/Transfer"));
const Transactions = lazy(() => import("./pages/Transactions"));
const UnifiedDepositWithdrawal = lazy(() => import("./pages/UnifiedDepositWithdrawal"));

const AgentPerformanceDashboard = lazy(() => import("./pages/AgentPerformanceDashboard"));
const Savings = lazy(() => import("./pages/Savings"));
const Receipts = lazy(() => import("./pages/Receipts"));
const QRCode = lazy(() => import("./pages/QRCode"));
const QRPayment = lazy(() => import("./pages/QRPayment"));
const AgentAuth = lazy(() => import("./pages/AgentAuth"));
const AgentServices = lazy(() => import("./pages/AgentServices"));
const DepositWithdrawalForm = lazy(() => import("./components/deposit-withdrawal/DepositWithdrawalForm"));
const AdminTreasury = lazy(() => import("./pages/AdminTreasury"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminAgentReports = lazy(() => import("./pages/AdminAgentReports"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminNotifications = lazy(() => import("./pages/AdminNotifications"));
const AdminTransactionMonitor = lazy(() => import("./pages/AdminTransactionMonitor"));
const Notifications = lazy(() => import("./pages/Notifications"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const BillPayments = lazy(() => import("./pages/BillPayments"));

// Optimized query client for mobile
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: (failureCount, error) => failureCount < 2,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  },
});

// Mobile-optimized loading component
const MobileLoader = () => (
  <div className="min-h-screen flex items-center justify-center p-4 bg-background">
    <Card className="w-full max-w-sm">
      <CardContent className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </CardContent>
    </Card>
  </div>
);

function App() {
  // Optimize viewport for all devices
  useEffect(() => {
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<MobileLoader />}>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Suspense fallback={<MobileLoader />}><Index /></Suspense>} />
                  <Route path="auth" element={<Suspense fallback={<MobileLoader />}><Auth /></Suspense>} />
                  <Route path="agent-auth" element={<Suspense fallback={<MobileLoader />}><AgentAuth /></Suspense>} />
                  <Route path="dashboard" element={<Suspense fallback={<MobileLoader />}><Dashboard /></Suspense>} />
                  <Route path="agent-dashboard" element={<Suspense fallback={<MobileLoader />}><NewAgentDashboard /></Suspense>} />
                  <Route path="admin-dashboard" element={<Suspense fallback={<MobileLoader />}><MainAdminDashboard /></Suspense>} />
                  <Route path="main-admin" element={<Suspense fallback={<MobileLoader />}><MainAdminDashboard /></Suspense>} />
                  <Route path="admin/treasury" element={<Suspense fallback={<MobileLoader />}><AdminTreasury /></Suspense>} />
                  <Route path="admin/users" element={<Suspense fallback={<MobileLoader />}><AdminUsers /></Suspense>} />
                  <Route path="admin/agent-reports" element={<Suspense fallback={<MobileLoader />}><AdminAgentReports /></Suspense>} />
                  <Route path="admin/settings" element={<Suspense fallback={<MobileLoader />}><AdminSettings /></Suspense>} />
                  <Route path="admin/notifications" element={<Suspense fallback={<MobileLoader />}><AdminNotifications /></Suspense>} />
                  <Route path="admin/transaction-monitor" element={<Suspense fallback={<MobileLoader />}><AdminTransactionMonitor /></Suspense>} />
                  <Route path="sub-admin-dashboard" element={<Suspense fallback={<MobileLoader />}><SubAdminDashboard /></Suspense>} />
                  <Route path="transfer" element={<Suspense fallback={<MobileLoader />}><Transfer /></Suspense>} />
                  <Route path="transactions" element={<Suspense fallback={<MobileLoader />}><Transactions /></Suspense>} />
                  <Route path="deposit" element={<Suspense fallback={<MobileLoader />}><UnifiedDepositWithdrawal /></Suspense>} />
                  <Route path="deposit-withdrawal" element={<Suspense fallback={<MobileLoader />}><DepositWithdrawalForm /></Suspense>} />
                  <Route path="agent-services" element={<Suspense fallback={<MobileLoader />}><AgentServices /></Suspense>} />
                  
                  <Route path="agent-performance" element={<Suspense fallback={<MobileLoader />}><AgentPerformanceDashboard /></Suspense>} />
                  <Route path="savings" element={<Suspense fallback={<MobileLoader />}><Savings /></Suspense>} />
                  <Route path="receipts" element={<Suspense fallback={<MobileLoader />}><Receipts /></Suspense>} />
                  <Route path="qr-code" element={<Suspense fallback={<MobileLoader />}><QRCode /></Suspense>} />
                  <Route path="qr-payment" element={<Suspense fallback={<MobileLoader />}><QRPayment /></Suspense>} />
                  <Route path="notifications" element={<Suspense fallback={<MobileLoader />}><Notifications /></Suspense>} />
                  <Route path="change-password" element={<Suspense fallback={<MobileLoader />}><ChangePassword /></Suspense>} />
                  <Route path="bill-payments" element={<Suspense fallback={<MobileLoader />}><BillPayments /></Suspense>} />
                </Route>
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
