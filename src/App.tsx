
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "@/components/Layout";
import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import QRCode from "@/pages/QRCode";
import QrScanner from "@/components/QrScanner";
import Receive from "@/pages/Receive";
import MobileRecharge from "@/pages/MobileRecharge";
import BillPayments from "@/pages/BillPayments";
import PrepaidCards from "@/pages/PrepaidCards";
import Transactions from "@/pages/Transactions";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster"
import Withdraw from "@/pages/Withdraw";
import Dashboard from "@/pages/Dashboard";
import VerifyIdentity from "@/pages/VerifyIdentity";
import AgentDashboard from "@/pages/AgentDashboard";
import AgentDeposit from "@/pages/AgentDeposit";
import AgentWithdrawal from "@/pages/AgentWithdrawal";
import Commission from "@/pages/Commission";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout><Index /></Layout>} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/withdraw" element={<Layout><Withdraw /></Layout>} />
          <Route path="/verify-identity" element={<VerifyIdentity />} />
          <Route path="/qrcode" element={<Layout><QRCode /></Layout>} />
          <Route path="/scan" element={<QrScanner />} />
          <Route path="/receive" element={<Layout><Receive /></Layout>} />
          <Route path="/mobile-recharge" element={<Layout><MobileRecharge /></Layout>} />
          <Route path="/bill-payments" element={<Layout><BillPayments /></Layout>} />
          <Route path="/prepaid-cards" element={<Layout><PrepaidCards /></Layout>} />
          <Route path="/transactions" element={<Layout><Transactions /></Layout>} />
          <Route path="/retrait-agent" element={<Layout><AgentDashboard /></Layout>} />
          <Route path="/agent-deposit" element={<Layout><AgentDeposit /></Layout>} />
          <Route path="/agent-withdrawal" element={<Layout><AgentWithdrawal /></Layout>} />
          <Route path="/commission" element={<Layout><Commission /></Layout>} />
          {/* Add redirection from /agent to /retrait-agent */}
          <Route path="/agent" element={<Navigate to="/retrait-agent" replace />} />
          <Route path="*" element={<Auth />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
