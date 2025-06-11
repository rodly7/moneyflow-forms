
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Banknote, Minus, Zap } from "lucide-react";
import { AgentBalanceCard } from "@/components/agent/AgentBalanceCard";
import { ClientSearchForm } from "@/components/agent/ClientSearchForm";
import { WithdrawalAmountForm } from "@/components/agent/WithdrawalAmountForm";
import { AgentAutomaticWithdrawalForm } from "@/components/agent/AgentAutomaticWithdrawalForm";
import { useAgentWithdrawal } from "@/hooks/useAgentWithdrawal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AgentWithdrawal = () => {
  const navigate = useNavigate();
  const {
    amount,
    setAmount,
    phoneNumber,
    setPhoneNumber,
    clientData,
    isSearchingClient,
    agentBalance,
    isLoadingBalance,
    isProcessing,
    fetchAgentBalance,
    searchClientByPhone,
    handleSubmit
  } = useAgentWithdrawal();

  const handleSearchClient = () => {
    if (phoneNumber) {
      searchClientByPhone(phoneNumber);
    }
  };

  console.log("Rendering AgentWithdrawal interface...");

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-4 px-0 sm:py-8 sm:px-4">
      <div className="container max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-gray-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Retraits Agent</h1>
          <div className="w-10"></div>
        </div>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Minus className="w-4 h-4" />
              Retrait Manuel
            </TabsTrigger>
            <TabsTrigger value="automatic" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Retrait Automatique
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Minus className="w-5 h-5 text-red-500" />
                  Retrait manuel pour un client
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingBalance ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <AgentBalanceCard
                      balance={agentBalance}
                      isLoading={isLoadingBalance}
                      onRefresh={fetchAgentBalance}
                    />

                    <ClientSearchForm
                      phoneNumber={phoneNumber}
                      clientData={clientData}
                      isSearching={isSearchingClient}
                      onPhoneChange={setPhoneNumber}
                      onSearch={handleSearchClient}
                    />

                    <WithdrawalAmountForm
                      amount={amount}
                      clientData={clientData}
                      onAmountChange={setAmount}
                    />

                    <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
                      <p>💸 Le compte du client sera débité et votre compte sera crédité</p>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-red-600 hover:bg-red-700 mt-4 h-12 text-lg"
                      disabled={isProcessing || !clientData || (amount && clientData && Number(amount) > clientData.balance)}
                    >
                      {isProcessing ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          <span>Traitement...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <Banknote className="mr-2 h-5 w-5" />
                          <span>Effectuer le retrait</span>
                        </div>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automatic" className="space-y-4">
            <AgentAutomaticWithdrawalForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AgentWithdrawal;
