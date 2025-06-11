
import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/toaster";
import Layout from "./components/Layout";
import QrScanner from "./components/QrScanner";

// Pages
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import QRCode from "./pages/QRCode";
import Dashboard from "./pages/Dashboard";
import Withdraw from "./pages/Withdraw";
import MobileRecharge from "./pages/MobileRecharge";
import BillPayments from "./pages/BillPayments";
import PrepaidCards from "./pages/PrepaidCards";
import Receive from "./pages/Receive";
import VerifyIdentity from "./pages/VerifyIdentity";
import Transactions from "./pages/Transactions";
import Commission from "./pages/Commission";
import AgentWithdrawal from "./pages/AgentWithdrawal";
import AgentWithdrawalAdvanced from "./pages/AgentWithdrawalAdvanced";
import AgentDeposit from "./pages/AgentDeposit";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout><Index /></Layout>} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/withdraw" element={<Layout><Withdraw /></Layout>} />
          <Route path="/agent-withdrawal" element={<Layout><AgentWithdrawal /></Layout>} />
          <Route path="/agent-withdrawal-advanced" element={<Layout><AgentWithdrawalAdvanced /></Layout>} />
          <Route path="/deposit" element={<Layout><AgentDeposit /></Layout>} />
          <Route path="/verify-identity" element={<VerifyIdentity />} />
          <Route path="/qrcode" element={<Layout><QRCode /></Layout>} />
          <Route path="/scan" element={<QrScanner />} />
          <Route path="/receive" element={<Layout><Receive /></Layout>} />
          <Route path="/mobile-recharge" element={<Layout><MobileRecharge /></Layout>} />
          <Route path="/bill-payments" element={<Layout><BillPayments /></Layout>} />
          <Route path="/prepaid-cards" element={<Layout><PrepaidCards /></Layout>} />
          <Route path="/transactions" element={<Layout><Transactions /></Layout>} />
          <Route path="/commission" element={<Layout><Commission /></Layout>} />
          <Route path="*" element={<Auth />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
