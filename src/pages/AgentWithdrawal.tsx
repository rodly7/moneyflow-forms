
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AgentAutomaticWithdrawalForm } from "@/components/agent/AgentAutomaticWithdrawalForm";

const AgentWithdrawal = () => {
  const navigate = useNavigate();

  console.log("Rendering AgentWithdrawal interface...");

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-4 px-0 sm:py-8 sm:px-4">
      <div className="container max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-gray-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Retrait Agent</h1>
          <div className="w-10"></div>
        </div>

        <AgentAutomaticWithdrawalForm />
      </div>
    </div>
  );
};

export default AgentWithdrawal;
