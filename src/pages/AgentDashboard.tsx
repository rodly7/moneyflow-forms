import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, formatCurrency, getCurrencyForCountry, calculateFee } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Banknote, CreditCard, Receipt, WalletCards } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useTransferForm } from "@/hooks/useTransferForm";

const AgentDashboard = () => {
  const { user, isAgent } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [verificationCode, setVerificationCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [commissionDetails, setCommissionDetails] = useState<{
    agentCommission: number;
    moneyFlowCommission: number;
    totalFee: number;
  } | null>(null);
  const { confirmWithdrawal } = useTransferForm();

  // Redirect non-agent users to the dashboard
  useEffect(() => {
    if (user && !isAgent()) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les autorisations nécessaires pour accéder à cette page",
        variant: "destructive"
      });
      navigate("/dashboard");
    }
  }, [user, isAgent, navigate, toast]);

  // Récupérer le profil de l'agent
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Récupérer les transactions récentes traitées par cet agent
  const { data: recentTransactions, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['agent-transactions'],
    queryFn: async () => {
      const { data: recharges, error: rechargeError } = await supabase
        .from('recharges')
        .select('*')
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })
        .limit(10);

      if (rechargeError) throw rechargeError;

      const { data: withdrawals, error: withdrawalError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })
        .limit(10);

      if (withdrawalError) throw withdrawalError;

      // Combiner et trier les transactions par date, en assurant que agent_commission existe
      const combined = [
        ...(recharges || []).map(r => ({ 
          ...r, 
          type: 'recharge',
          agent_commission: r.agent_commission ?? (r.amount * 0.005) // Default to 0.5% if not present
        })),
        ...(withdrawals || []).map(w => ({ 
          ...w, 
          type: 'withdrawal',
          agent_commission: w.agent_commission ?? (w.amount * 0.005) // Default to 0.5% if not present
        }))
      ].sort((a, b) => 
        new Date(b.updated_at || b.created_at).getTime() - 
        new Date(a.updated_at || a.created_at).getTime()
      ).slice(0, 10);

      return combined;
    },
    enabled: !!user,
  });

  // Obtenir la devise de l'utilisateur
  const userCurrency = profile?.country ? getCurrencyForCountry(profile.country) : "XAF";

  // Fonction pour traiter un retrait
  const handleVerifyWithdrawal = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Code invalide",
        description: "Veuillez entrer un code à 6 chiffres",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const result = await confirmWithdrawal(verificationCode);
      
      if (result.success) {
        setCommissionDetails({
          agentCommission: result.agentCommission || 0,
          moneyFlowCommission: result.moneyFlowCommission || 0,
          totalFee: result.totalFee || 0
        });
        
        toast({
          title: "Retrait confirmé",
          description: `Le retrait a été effectué avec succès. Votre commission: ${formatCurrency(result.agentCommission || 0, userCurrency)}`,
        });
      } else {
        toast({
          title: "Erreur",
          description: result.message || "Une erreur est survenue lors de la vérification du code",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du code:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la vérification du code",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const closeCommissionDetails = () => {
    setCommissionDetails(null);
    setVerificationCode("");
  };

  if (!user || !isAgent()) {
    return null; // Don't render anything if not an agent
  }

  if (isProfileLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-4 px-0 sm:py-8 sm:px-4">
      <div className="container max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="text-gray-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Interface Agent</h1>
          <div className="w-10"></div>
        </div>

        {/* Carte de profil */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Profil Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <p className="font-medium">{profile?.full_name}</p>
                <p className="text-sm text-gray-500">{profile?.phone}</p>
                <p className="text-sm text-gray-500">{profile?.country || "Non spécifié"}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Votre solde</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(profile?.balance || 0, userCurrency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions for Agent */}
        <div className="grid grid-cols-2 gap-4">
          <Button 
            onClick={() => navigate("/agent-deposit")}
            variant="outline" 
            className="flex flex-col items-center justify-center h-24 bg-white"
          >
            <Banknote className="h-8 w-8 mb-2" />
            <span className="text-sm font-medium">Dépôt</span>
          </Button>
          
          <Button 
            onClick={() => setCommissionDetails(null)} 
            variant="outline" 
            className="flex flex-col items-center justify-center h-24 bg-white"
          >
            <CreditCard className="h-8 w-8 mb-2" />
            <span className="text-sm font-medium">Retrait</span>
          </Button>
          
          <Button 
            onClick={() => navigate("/transactions")} 
            variant="outline" 
            className="flex flex-col items-center justify-center h-24 bg-white"
          >
            <Receipt className="h-8 w-8 mb-2" />
            <span className="text-sm font-medium">Historique</span>
          </Button>
          
          <Button 
            onClick={() => navigate("/transactions")} 
            variant="outline" 
            className="flex flex-col items-center justify-center h-24 bg-white"
          >
            <WalletCards className="h-8 w-8 mb-2" />
            <span className="text-sm font-medium">Commissions</span>
          </Button>
        </div>

        {/* Onglet pour les retraits */}
        <Card>
          <CardHeader>
            <CardTitle>Confirmer un retrait</CardTitle>
            <CardDescription>
              Entrez le code fourni par l'utilisateur pour confirmer son retrait
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {commissionDetails ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Votre commission:</span>
                    <span className="font-medium text-emerald-600">
                      {formatCurrency(commissionDetails.agentCommission, userCurrency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Commission MoneyFlow:</span>
                    <span className="font-medium">{formatCurrency(commissionDetails.moneyFlowCommission, userCurrency)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm font-medium">Frais totaux:</span>
                    <span className="font-bold">{formatCurrency(commissionDetails.totalFee, userCurrency)}</span>
                  </div>
                </div>
                
                <Button 
                  onClick={closeCommissionDetails} 
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  Fermer
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="withdrawalCode">Code de retrait</Label>
                  <InputOTP 
                    maxLength={6}
                    value={verificationCode}
                    onChange={setVerificationCode}
                    disabled={isProcessing}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleVerifyWithdrawal}
                  disabled={verificationCode.length !== 6 || isProcessing}
                >
                  {isProcessing ? "Traitement en cours..." : "Confirmer le retrait"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Historique des transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des opérations</CardTitle>
            <CardDescription>Vos dernières opérations et commissions</CardDescription>
          </CardHeader>
          <CardContent>
            {isTransactionsLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              </div>
            ) : recentTransactions && recentTransactions.length > 0 ? (
              <div className="space-y-2">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {transaction.type === 'recharge' ? 'Dépôt' : 'Retrait'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.updated_at || transaction.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <div className={`font-bold ${transaction.type === 'recharge' ? 'text-red-600' : 'text-emerald-600'}`}>
                        {transaction.type === 'recharge' ? '-' : '+'} {formatCurrency(transaction.amount, userCurrency)}
                      </div>
                      <div className="text-xs text-emerald-700 text-right">
                        Commission: {formatCurrency(transaction.agent_commission || 0, userCurrency)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-gray-500">Aucune transaction récente</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentDashboard;
