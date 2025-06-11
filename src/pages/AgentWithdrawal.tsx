
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Banknote, Wallet, RefreshCw, Search, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/integrations/supabase/client";
import { getUserBalance, findUserByPhone, processAgentWithdrawal } from "@/services/withdrawalService";

const AgentWithdrawal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [clientData, setClientData] = useState<any>(null);
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [agentBalance, setAgentBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  console.log("AgentWithdrawal component rendering...");

  const fetchAgentBalance = async () => {
    if (user?.id) {
      setIsLoadingBalance(true);
      try {
        console.log("🔍 Récupération du solde agent...");
        const balanceData = await getUserBalance(user.id);
        setAgentBalance(balanceData.balance);
        console.log("✅ Solde agent:", balanceData.balance, "FCFA");
      } catch (error) {
        console.error("❌ Erreur lors du chargement du solde:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger votre solde",
          variant: "destructive"
        });
      }
      setIsLoadingBalance(false);
    }
  };

  const searchClientByPhone = async (phone: string) => {
    if (!phone || phone.length < 6) {
      setClientData(null);
      return;
    }

    setIsSearchingClient(true);
    try {
      console.log("🔍 Recherche client:", phone);
      
      const client = await findUserByPhone(phone);
      
      if (client) {
        setClientData(client);
        console.log("✅ Client trouvé:", client.full_name);
        
        toast({
          title: "Client trouvé",
          description: `${client.full_name || 'Utilisateur'} - Solde: ${formatCurrency(client.balance || 0, 'XAF')}`,
        });
      } else {
        setClientData(null);
        toast({
          title: "Client non trouvé",
          description: "Aucun utilisateur trouvé avec ce numéro",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("❌ Erreur recherche:", error);
      setClientData(null);
      toast({
        title: "Erreur de recherche",
        description: "Impossible de rechercher le client",
        variant: "destructive"
      });
    }
    setIsSearchingClient(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide",
        variant: "destructive"
      });
      return;
    }

    if (!clientData) {
      toast({
        title: "Client requis",
        description: "Veuillez d'abord rechercher le client",
        variant: "destructive"
      });
      return;
    }

    const operationAmount = Number(amount);

    if (operationAmount > clientData.balance) {
      toast({
        title: "Solde insuffisant",
        description: `Le client n'a que ${formatCurrency(clientData.balance, 'XAF')}`,
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);

      const result = await processAgentWithdrawal(
        user?.id || '',
        clientData.id,
        operationAmount,
        phoneNumber
      );

      toast({
        title: "Retrait effectué",
        description: `Retrait de ${formatCurrency(operationAmount, 'XAF')} effectué`,
      });

      // Reset form
      setAmount("");
      setPhoneNumber("");
      setClientData(null);
      
      // Refresh balance
      fetchAgentBalance();
      
    } catch (error) {
      console.error("❌ Erreur retrait:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors du retrait",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    console.log("useEffect - fetchAgentBalance");
    fetchAgentBalance();
  }, [user]);

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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Minus className="w-5 h-5 text-red-500" />
              Retrait pour un client
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingBalance ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Solde agent */}
                <div className="px-3 py-2 bg-emerald-50 rounded-md text-sm border border-emerald-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Wallet className="w-4 h-4 mr-2 text-emerald-600" />
                      <span className="font-medium">Votre solde agent:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${agentBalance > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(agentBalance, 'XAF')}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={fetchAgentBalance}
                        disabled={isLoadingBalance}
                        className="h-6 w-6 p-0"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Recherche client */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Numéro du client</Label>
                  <div className="flex gap-2">
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Entrez le numéro du client"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      className="h-12"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => searchClientByPhone(phoneNumber)}
                      disabled={isSearchingClient || !phoneNumber}
                      className="h-12 px-3"
                    >
                      {isSearchingClient ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  
                  {clientData && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-green-800 font-medium">
                        ✓ Client: {clientData.full_name || 'Nom non disponible'}
                      </p>
                      <p className="text-green-700 text-sm">
                        Solde: {formatCurrency(clientData.balance || 0, 'XAF')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Montant */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Montant du retrait (XAF)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Entrez le montant"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="h-12 text-lg"
                    disabled={!clientData}
                  />
                  {amount && clientData && Number(amount) > clientData.balance && (
                    <p className="text-red-600 text-sm">
                      Le montant dépasse le solde du client
                    </p>
                  )}
                </div>

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
      </div>
    </div>
  );
};

export default AgentWithdrawal;
