
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import QRCode from "./pages/QRCode";
import Transactions from "./pages/Transactions";
import Withdraw from "./pages/Withdraw";
import Receive from "./pages/Receive";
import MainAdminDashboard from "./pages/MainAdminDashboard";
import SubAdminDashboard from "./pages/SubAdminDashboard";
import NewAgentDashboard from "./pages/NewAgentDashboard";
import AgentAuth from "./pages/AgentAuth";
import AgentServices from "./pages/AgentServices";
import AgentReports from "./pages/AgentReports";
import Commission from "./pages/Commission";
import UnifiedDepositWithdrawal from "./pages/UnifiedDepositWithdrawal";
import AgentDeposit from "./pages/AgentDeposit";
import AgentWithdrawalSimple from "./pages/AgentWithdrawalSimple";
import AgentWithdrawalAdvanced from "./pages/AgentWithdrawalAdvanced";
import BillPayments from "./pages/BillPayments";
import PrepaidCards from "./pages/PrepaidCards";
import VerifyIdentity from "./pages/VerifyIdentity";
import AdminBalanceUpdate from "./pages/AdminBalanceUpdate";

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
              <Route path="/qr" element={<QRCode />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/withdraw" element={<Withdraw />} />
              <Route path="/receive" element={<Receive />} />
              <Route path="/main-admin" element={<MainAdminDashboard />} />
              <Route path="/sub-admin" element={<SubAdminDashboard />} />
              <Route path="/agent-dashboard" element={<NewAgentDashboard />} />
              <Route path="/agent-auth" element={<AgentAuth />} />
              <Route path="/agent-services" element={<AgentServices />} />
              <Route path="/agent-reports" element={<AgentReports />} />
              <Route path="/commission" element={<Commission />} />
              <Route path="/deposit-withdrawal" element={<UnifiedDepositWithdrawal />} />
              <Route path="/agent-deposit" element={<AgentDeposit />} />
              <Route path="/agent-withdrawal-simple" element={<AgentWithdrawalSimple />} />
              <Route path="/agent-withdrawal-advanced" element={<AgentWithdrawalAdvanced />} />
              <Route path="/bill-payments" element={<BillPayments />} />
              <Route path="/prepaid-cards" element={<PrepaidCards />} />
              <Route path="/verify-identity" element={<VerifyIdentity />} />
              <Route path="/admin-balance-update" element={<AdminBalanceUpdate />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
