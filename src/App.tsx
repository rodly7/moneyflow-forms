
import {
  BrowserRouter as Router,
  Routes,
  Route,
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
          <Route path="/scan" element={<Layout><QrScanner /></Layout>} />
          <Route path="/receive" element={<Layout><Receive /></Layout>} />
          <Route path="/mobile-recharge" element={<Layout><MobileRecharge /></Layout>} />
          <Route path="/bill-payments" element={<Layout><BillPayments /></Layout>} />
          <Route path="/prepaid-cards" element={<Layout><PrepaidCards /></Layout>} />
          <Route path="/transactions" element={<Layout><Transactions /></Layout>} />
          <Route path="*" element={<Auth />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
