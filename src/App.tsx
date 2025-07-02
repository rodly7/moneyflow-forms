import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NewAgentDashboard from "./pages/NewAgentDashboard";
import MainAdminDashboard from "./pages/MainAdminDashboard";
import SubAdminDashboard from "./pages/SubAdminDashboard";
import Transfer from "./pages/Transfer";
import Transactions from "./pages/Transactions";
import UnifiedDepositWithdrawal from "./pages/UnifiedDepositWithdrawal";
import Commission from "./pages/Commission";
import AgentPerformanceDashboard from "./pages/AgentPerformanceDashboard";
import Savings from "./pages/Savings";
import Receipts from "./pages/Receipts";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/agent-dashboard" element={<NewAgentDashboard />} />
              <Route path="/admin-dashboard" element={<MainAdminDashboard />} />
              <Route path="/sub-admin-dashboard" element={<SubAdminDashboard />} />
              <Route path="/transfer" element={<Transfer />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/deposit" element={<UnifiedDepositWithdrawal />} />
              <Route path="/commission" element={<Commission />} />
              <Route path="/agent-performance" element={<AgentPerformanceDashboard />} />
              <Route path="/savings" element={<Savings />} />
              <Route path="/receipts" element={<Receipts />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
