
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Banknote, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase, formatCurrency } from "@/integrations/supabase/client";
import { useSimpleWithdrawal } from "@/hooks/useSimpleWithdrawal";

const Withdraw = () => {
  const { user, isAgent } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { processWithdrawal, isProcessing } = useSimpleWithdrawal();

  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userBalance, setUserBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  useEffect(() => {
    const fetchUserBalance = async () => {
      if (user?.id) {
        setIsLoadingBalance(true);
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('balance, phone')
            .eq('id', user.id)
            .single();

          if (profile) {
            setUserBalance(profile.balance);
            if (!isAgent()) {
              setPhoneNumber(profile.phone || '');
            }
          }
        } catch (error) {
          console.error("Erreur lors du chargement du solde:", error);
          toast({
            title: "Erreur",
            description: "Impossible de charger votre solde",
            variant: "destructive"
          });
        }
        setIsLoadingBalance(false);
      }
    };

    fetchUserBalance();
  }, [user, toast, isAgent]);

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

    const result = await processWithdrawal(Number(amount), phoneNumber);
    
    if (result.success) {
      setAmount("");
      setPhoneNumber("");
      navigate('/dashboard');
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
            {isLoadingBalance ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Affichage du solde */}
                <div className="px-3 py-2 bg-emerald-50 rounded-md text-sm border border-emerald-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Wallet className="w-4 h-4 mr-2 text-emerald-600" />
                      <span className="font-medium">
                        {isAgent() ? "Solde disponible:" : "Votre solde:"}
                      </span>
                    </div>
                    <span className={`font-bold ${userBalance > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrency(userBalance, 'XAF')}
                    </span>
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
                      Le montant dépasse le solde disponible
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    {isAgent() ? "Numéro du client" : "Votre numéro de téléphone"}
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Entrez le numéro de téléphone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="h-12"
                    readOnly={!isAgent()}
                  />
                </div>

                {!isAgent() && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
                    <p>Rendez-vous chez un agent MoneyFlow avec votre code de retrait pour finaliser la transaction.</p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4 h-12 text-lg"
                  disabled={isProcessing || isAmountExceedsBalance}
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
