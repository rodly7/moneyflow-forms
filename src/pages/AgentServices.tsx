
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Shield, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SecureAgentWithdrawalForm } from "@/components/agent/SecureAgentWithdrawalForm";
import { AgentBalanceCard } from "@/components/agent/AgentBalanceCard";
import { AgentTransferForm } from "@/components/agent/AgentTransferForm";
import { getUserBalance } from "@/services/withdrawalService";

const AgentServices = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [agentBalance, setAgentBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const fetchAgentBalance = async () => {
    if (user?.id) {
      setIsLoadingBalance(true);
      try {
        const balanceData = await getUserBalance(user.id);
        setAgentBalance(balanceData.balance);
      } catch (error) {
        console.error("❌ Erreur lors du chargement du solde agent:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger votre solde",
          variant: "destructive"
        });
      }
      setIsLoadingBalance(false);
    }
  };

  if (!profile || profile.role !== 'agent') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-red-600 mb-4">Accès refusé</h2>
              <p className="text-gray-600 mb-4">Cette page est réservée aux agents.</p>
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Retour au tableau de bord
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-4 px-0 sm:py-8 sm:px-4">
      <div className="container max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-gray-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Services Agent</h1>
          <div className="w-10"></div>
        </div>

        {/* Solde Agent */}
        <AgentBalanceCard 
          balance={agentBalance}
          isLoading={isLoadingBalance}
          onRefresh={fetchAgentBalance}
          userCountry={profile.country}
        />

        <Tabs defaultValue="transfer" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transfer" className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              Transfert
            </TabsTrigger>
            <TabsTrigger value="deposit" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Dépôt
            </TabsTrigger>
            <TabsTrigger value="withdrawal" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Retrait
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transfer">
            <AgentTransferForm />
          </TabsContent>

          <TabsContent value="deposit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-600">
                  <Plus className="w-5 h-5" />
                  Dépôt Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    Les dépôts sont gérés via l'interface principale
                  </p>
                  <Button 
                    onClick={() => navigate('/deposit-withdrawal')}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Aller aux dépôts/retraits
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawal">
            <SecureAgentWithdrawalForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AgentServices;
