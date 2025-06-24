
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions";
import QRCode from "@/pages/QRCode";
import Receive from "@/pages/Receive";
import Withdraw from "@/pages/Withdraw";
import AgentWithdrawal from "@/pages/AgentWithdrawal";
import AgentWithdrawalSimple from "@/pages/AgentWithdrawalSimple";
import AgentWithdrawalAdvanced from "@/pages/AgentWithdrawalAdvanced";
import AgentDeposit from "@/pages/AgentDeposit";
import UnifiedDepositWithdrawal from "@/pages/UnifiedDepositWithdrawal";
import BillPayments from "@/pages/BillPayments";
import PrepaidCards from "@/pages/PrepaidCards";
import VerifyIdentity from "@/pages/VerifyIdentity";
import Commission from "@/pages/Commission";
import AdminBalanceUpdate from "@/pages/AdminBalanceUpdate";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Index />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="qr-code" element={<QRCode />} />
              <Route path="receive" element={<Receive />} />
              <Route path="withdraw" element={<Withdraw />} />
              <Route path="agent-withdrawal" element={<AgentWithdrawal />} />
              <Route path="agent-withdrawal-simple" element={<AgentWithdrawalSimple />} />
              <Route path="agent-withdrawal-advanced" element={<AgentWithdrawalAdvanced />} />
              <Route path="deposit" element={<AgentDeposit />} />
              <Route path="agent-services" element={<UnifiedDepositWithdrawal />} />
              <Route path="bill-payments" element={<BillPayments />} />
              <Route path="prepaid-cards" element={<PrepaidCards />} />
              <Route path="verify-identity" element={<VerifyIdentity />} />
              <Route path="commission" element={<Commission />} />
              <Route path="admin/balance-update" element={<AdminBalanceUpdate />} />
              <Route path="auth" element={<Auth />} />
            </Route>
          </Routes>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
