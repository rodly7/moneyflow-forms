
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Minus, User, Wallet, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/integrations/supabase/client";
import { useUserSearch } from "@/hooks/useUserSearch";
import { useDepositWithdrawalOperations } from "@/hooks/useDepositWithdrawalOperations";
import { getUserBalance } from "@/services/withdrawalService";
import { useAuth } from "@/contexts/AuthContext";
import { calculateDepositFees, calculateWithdrawalFees } from "@/utils/depositWithdrawalCalculations";

const DepositWithdrawalForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [clientData, setClientData] = useState<any>(null);
  const [agentBalance, setAgentBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  const { searchUserByPhone, isSearching } = useUserSearch();
  const { processDeposit, processWithdrawal, isProcessing } = useDepositWithdrawalOperations();

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

  useEffect(() => {
    fetchAgentBalance();
  }, [user]);

  const searchClient = async () => {
    if (!phoneNumber || phoneNumber.length < 6) {
      toast({
        title: "Numéro invalide",
        description: "Veuillez entrer un numéro de téléphone valide",
        variant: "destructive"
      });
      return;
    }

    try {
      const client = await searchUserByPhone(phoneNumber);
      
      if (client) {
        setClientData(client);
        toast({
          title: "Client trouvé",
          description: `${client.full_name || 'Utilisateur'} - Solde: ${formatCurrency(client.balance || 0, 'XAF')}`,
        });
      } else {
        setClientData(null);
        toast({
          title: "Client non trouvé",
          description: "Ce numéro n'existe pas dans notre base de données",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("❌ Erreur lors de la recherche:", error);
      toast({
        title: "Erreur de recherche",
        description: "Impossible de rechercher le client",
        variant: "destructive"
      });
      setClientData(null);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
    if (clientData) {
      setClientData(null);
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientData || !amount) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez rechercher un client et entrer un montant",
        variant: "destructive"
      });
      return;
    }

    const depositAmount = Number(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide",
        variant: "destructive"
      });
      return;
    }

    if (depositAmount > agentBalance) {
      toast({
        title: "Solde insuffisant",
        description: `Votre solde (${formatCurrency(agentBalance, 'XAF')}) est insuffisant pour ce dépôt`,
        variant: "destructive"
      });
      return;
    }

    const success = await processDeposit(
      depositAmount,
      clientData.id,
      clientData.full_name || 'Utilisateur',
      phoneNumber
    );

    if (success) {
      setPhoneNumber("");
      setAmount("");
      setClientData(null);
      fetchAgentBalance();
    }
  };

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientData || !amount) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez rechercher un client et entrer un montant",
        variant: "destructive"
      });
      return;
    }

    const withdrawalAmount = Number(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide",
        variant: "destructive"
      });
      return;
    }

    const { totalFee } = calculateWithdrawalFees(withdrawalAmount);
    const totalAmount = withdrawalAmount + totalFee;

    if (totalAmount > clientData.balance) {
      toast({
        title: "Solde client insuffisant",
        description: `Le solde du client (${formatCurrency(clientData.balance, 'XAF')}) est insuffisant pour ce retrait (montant + frais: ${formatCurrency(totalAmount, 'XAF')})`,
        variant: "destructive"
      });
      return;
    }

    const success = await processWithdrawal(
      withdrawalAmount,
      clientData.id,
      clientData.full_name || 'Utilisateur',
      phoneNumber
    );

    if (success) {
      setPhoneNumber("");
      setAmount("");
      setClientData(null);
      fetchAgentBalance();
    }
  };

  // Calculer les frais pour l'affichage
  const depositFees = amount ? calculateDepositFees(Number(amount)) : null;
  const withdrawalFees = amount ? calculateWithdrawalFees(Number(amount)) : null;

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
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Wallet className="w-5 h-5 mr-2 text-emerald-600" />
                <span className="font-medium">Votre solde:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-bold text-lg ${agentBalance > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(agentBalance, 'XAF')}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchAgentBalance}
                  disabled={isLoadingBalance}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Dépôt (Sans frais)
            </TabsTrigger>
            <TabsTrigger value="withdrawal" className="flex items-center gap-2">
              <Minus className="w-4 h-4" />
              Retrait (1,5%)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deposit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-600">
                  <Plus className="w-5 h-5" />
                  Dépôt Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDepositSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone-deposit">Numéro du client</Label>
                    <div className="flex gap-2">
                      <Input
                        id="phone-deposit"
                        type="tel"
                        placeholder="Entrez le numéro du client"
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        required
                        className="h-12"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={searchClient}
                        disabled={isSearching || !phoneNumber}
                        className="h-12 px-3"
                      >
                        {isSearching ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                        ) : (
                          "Rechercher"
                        )}
                      </Button>
                    </div>
                  </div>

                  {clientData && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-2">
                      <div className="flex items-center text-green-800">
                        <User className="w-4 h-4 mr-2" />
                        <span className="font-medium">{clientData.full_name || 'Nom non disponible'}</span>
                      </div>
                      <div className="flex items-center text-green-700">
                        <Wallet className="w-4 h-4 mr-2" />
                        <span>Solde: {formatCurrency(clientData.balance || 0, 'XAF')}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="amount-deposit">Montant du dépôt (XAF)</Label>
                    <Input
                      id="amount-deposit"
                      type="number"
                      placeholder="Entrez le montant"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      className="h-12 text-lg"
                      disabled={!clientData}
                    />
                  </div>

                  {amount && depositFees && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Montant:</span>
                          <span className="font-medium">{formatCurrency(Number(amount), 'XAF')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Frais:</span>
                          <span className="font-medium text-emerald-600">{formatCurrency(depositFees.totalFee, 'XAF')}</span>
                        </div>
                        <div className="flex justify-between font-semibold border-t pt-2">
                          <span>Total à débiter:</span>
                          <span>{formatCurrency(Number(amount), 'XAF')}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg"
                    disabled={isProcessing || !clientData || !amount || Number(amount) > agentBalance}
                  >
                    {isProcessing ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        <span>Traitement...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Plus className="mr-2 h-5 w-5" />
                        <span>Effectuer le dépôt</span>
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawal">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <Minus className="w-5 h-5" />
                  Retrait Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone-withdrawal">Numéro du client</Label>
                    <div className="flex gap-2">
                      <Input
                        id="phone-withdrawal"
                        type="tel"
                        placeholder="Entrez le numéro du client"
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        required
                        className="h-12"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={searchClient}
                        disabled={isSearching || !phoneNumber}
                        className="h-12 px-3"
                      >
                        {isSearching ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                        ) : (
                          "Rechercher"
                        )}
                      </Button>
                    </div>
                  </div>

                  {clientData && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-2">
                      <div className="flex items-center text-green-800">
                        <User className="w-4 h-4 mr-2" />
                        <span className="font-medium">{clientData.full_name || 'Nom non disponible'}</span>
                      </div>
                      <div className="flex items-center text-green-700">
                        <Wallet className="w-4 h-4 mr-2" />
                        <span>Solde: {formatCurrency(clientData.balance || 0, 'XAF')}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="amount-withdrawal">Montant du retrait (XAF)</Label>
                    <Input
                      id="amount-withdrawal"
                      type="number"
                      placeholder="Entrez le montant"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      className="h-12 text-lg"
                      disabled={!clientData}
                    />
                  </div>

                  {amount && withdrawalFees && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-md">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Montant:</span>
                          <span className="font-medium">{formatCurrency(Number(amount), 'XAF')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Frais (1,5%):</span>
                          <span className="font-medium text-orange-600">{formatCurrency(withdrawalFees.totalFee, 'XAF')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Votre commission (0,5%):</span>
                          <span className="font-medium text-emerald-600">{formatCurrency(withdrawalFees.agentCommission, 'XAF')}</span>
                        </div>
                        <div className="flex justify-between font-semibold border-t pt-2">
                          <span>Total à débiter du client:</span>
                          <span>{formatCurrency(Number(amount) + withdrawalFees.totalFee, 'XAF')}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-lg"
                    disabled={isProcessing || !clientData || !amount || (clientData && Number(amount) + (withdrawalFees?.totalFee || 0) > clientData.balance)}
                  >
                    {isProcessing ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        <span>Traitement...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Minus className="mr-2 h-5 w-5" />
                        <span>Effectuer le retrait</span>
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DepositWithdrawalForm;
