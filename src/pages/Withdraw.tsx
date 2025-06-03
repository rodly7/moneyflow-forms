
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Banknote, Wallet, RefreshCw, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/integrations/supabase/client";
import { getUserBalance, findUserByPhone } from "@/services/withdrawalService";
import { supabase } from "@/integrations/supabase/client";

const Withdraw = () => {
  const { user, isAgent } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientFound, setClientFound] = useState(false);
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const fetchUserBalanceFromDB = async () => {
    if (user?.id) {
      setIsLoadingBalance(true);
      try {
        console.log("🔍 Récupération du solde utilisateur depuis la base de données...");
        const balanceData = await getUserBalance(user.id);
        
        setUserBalance(balanceData.balance);
        
        console.log("✅ Solde affiché:", balanceData.balance, "FCFA");
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

  const fetchUserProfile = async () => {
    if (user?.id) {
      setIsLoadingProfile(true);
      try {
        console.log("🔍 Récupération du profil utilisateur depuis la base de données...");
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('phone, full_name')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("❌ Erreur lors de la récupération du profil:", error);
          throw error;
        }

        if (profile) {
          setPhoneNumber(profile.phone || '');
          console.log("✅ Profil récupéré:", {
            nom: profile.full_name,
            telephone: profile.phone
          });
        }
      } catch (error) {
        console.error("❌ Erreur lors du chargement du profil:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger votre profil",
          variant: "destructive"
        });
      }
      setIsLoadingProfile(false);
    }
  };

  const searchClientByPhone = async (phone: string) => {
    if (!phone || phone.length < 6) {
      setClientFound(false);
      setClientName("");
      return;
    }

    setIsSearchingClient(true);
    try {
      console.log("🔍 Recherche du client avec le numéro:", phone);
      
      const client = await findUserByPhone(phone);
      
      if (client) {
        setClientName(client.full_name || 'Nom non disponible');
        setClientFound(true);
        console.log("✅ Client trouvé:", {
          nom: client.full_name,
          telephone: client.phone,
          solde: client.balance
        });
        
        toast({
          title: "Client trouvé",
          description: `${client.full_name || 'Utilisateur'} - Solde: ${formatCurrency(client.balance || 0, 'XAF')}`,
        });
      } else {
        setClientFound(false);
        setClientName("");
        toast({
          title: "Client non trouvé",
          description: "Aucun utilisateur trouvé avec ce numéro de téléphone",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("❌ Erreur lors de la recherche du client:", error);
      setClientFound(false);
      setClientName("");
      toast({
        title: "Erreur de recherche",
        description: "Impossible de rechercher le client",
        variant: "destructive"
      });
    }
    setIsSearchingClient(false);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneNumber(value);
    
    if (isAgent()) {
      // Réinitialiser l'état du client trouvé
      setClientFound(false);
      setClientName("");
    }
  };

  const handleSearchClient = () => {
    if (isAgent() && phoneNumber) {
      searchClientByPhone(phoneNumber);
    }
  };

  useEffect(() => {
    fetchUserBalanceFromDB();
    if (!isAgent()) {
      fetchUserProfile();
    } else {
      setIsLoadingProfile(false);
    }
  }, [user, isAgent]);

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

    if (!phoneNumber) {
      toast({
        title: "Numéro requis",
        description: "Veuillez entrer un numéro de téléphone",
        variant: "destructive"
      });
      return;
    }

    if (isAgent() && !clientFound) {
      toast({
        title: "Client non vérifié",
        description: "Veuillez d'abord rechercher et vérifier le client",
        variant: "destructive"
      });
      return;
    }

    if (Number(amount) > userBalance) {
      toast({
        title: "Solde insuffisant",
        description: `Votre solde (${formatCurrency(userBalance, 'XAF')}) est insuffisant pour ce retrait`,
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);

      if (!user?.id) {
        throw new Error("Utilisateur non connecté");
      }

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      const { error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user.id,
          amount: Number(amount),
          withdrawal_phone: phoneNumber,
          status: isAgent() ? 'agent_pending' : 'pending',
          verification_code: verificationCode
        });

      if (error) throw error;

      toast({
        title: "Demande de retrait créée",
        description: `Code de vérification: ${verificationCode}`,
      });

      setAmount("");
      if (isAgent()) {
        setPhoneNumber("");
        setClientFound(false);
        setClientName("");
      }
      navigate('/dashboard');
    } catch (error) {
      console.error("❌ Erreur lors du retrait:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors du retrait",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const isAmountExceedsBalance = amount && Number(amount) > userBalance;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-4 px-0 sm:py-8 sm:px-4">
      <div className="container max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-gray-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Retrait</h1>
          <div className="w-10"></div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {isAgent() ? "Effectuer un retrait pour un client" : "Demande de retrait"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(isLoadingBalance || isLoadingProfile) ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Affichage du solde avec bouton d'actualisation */}
                <div className="px-3 py-2 bg-emerald-50 rounded-md text-sm border border-emerald-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Wallet className="w-4 h-4 mr-2 text-emerald-600" />
                      <span className="font-medium">
                        {isAgent() ? "Solde disponible:" : "Votre solde:"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${userBalance > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(userBalance, 'XAF')}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={fetchUserBalanceFromDB}
                        disabled={isLoadingBalance}
                        className="h-6 w-6 p-0"
                      >
                        <RefreshCw className={`w-3 h-3 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Montant (XAF)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Entrez le montant"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="h-12 text-lg"
                  />
                  {isAmountExceedsBalance && (
                    <p className="text-red-600 text-sm">
                      Le montant dépasse le solde disponible ({formatCurrency(userBalance, 'XAF')})
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    {isAgent() ? "Numéro du client" : "Votre numéro de téléphone"}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="phone"
                      type="tel"
                      placeholder={isAgent() ? "Entrez le numéro du client" : "Votre numéro sera récupéré automatiquement"}
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      required
                      className="h-12"
                      readOnly={!isAgent()}
                    />
                    {isAgent() && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSearchClient}
                        disabled={isSearchingClient || !phoneNumber}
                        className="h-12 px-3"
                      >
                        {isSearchingClient ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  
                  {!isAgent() && phoneNumber && (
                    <p className="text-green-600 text-sm">
                      ✓ Numéro récupéré depuis votre profil
                    </p>
                  )}
                  
                  {isAgent() && clientFound && clientName && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-green-800 font-medium">
                        ✓ Client trouvé: {clientName}
                      </p>
                    </div>
                  )}
                </div>

                {!isAgent() && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
                    <p>Rendez-vous chez un agent MoneyFlow avec votre code de retrait pour finaliser la transaction.</p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4 h-12 text-lg"
                  disabled={isProcessing || isAmountExceedsBalance || userBalance <= 0 || (isAgent() && !clientFound)}
                >
                  {isProcessing ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span>Traitement...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Banknote className="mr-2 h-5 w-5" />
                      <span>
                        {isAgent() ? "Créer la demande" : "Demander le retrait"}
                      </span>
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

export default Withdraw;
