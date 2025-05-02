
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase, formatCurrency, getCurrencyForCountry } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Wallet, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const AgentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [verificationCode, setVerificationCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

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

      // Combiner et trier les transactions par date
      const combined = [
        ...(recharges || []).map(r => ({ ...r, type: 'recharge' })),
        ...(withdrawals || []).map(w => ({ ...w, type: 'withdrawal' }))
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

  // Fonction pour gérer la vérification d'un code de recharge
  const handleVerifyRecharge = async () => {
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
      // Vérifier si le code existe et est valide
      const { data, error } = await supabase
        .from('recharges')
        .select('*')
        .eq('transaction_reference', verificationCode)
        .eq('status', 'pending')
        .single();
        
      if (error || !data) {
        throw new Error("Code de recharge invalide ou déjà utilisé");
      }
      
      // S'assurer que l'agent n'est pas l'utilisateur qui a fait la demande
      if (data.user_id === user?.id) {
        throw new Error("Vous ne pouvez pas confirmer votre propre recharge");
      }

      // Mettre à jour le statut de la recharge
      await supabase
        .from('recharges')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);
        
      // Ajouter le montant au solde de l'utilisateur
      await supabase.rpc('increment_balance', {
        user_id: data.user_id,
        amount: data.amount
      });
      
      // Déduire le montant du compte de l'agent
      await supabase.rpc('increment_balance', {
        user_id: user?.id,
        amount: -data.amount
      });
      
      toast({
        title: "Recharge confirmée",
        description: `La recharge de ${formatCurrency(data.amount, userCurrency)} a été effectuée avec succès`,
      });
      
      // Réinitialiser le code de vérification
      setVerificationCode("");
      
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
      // Vérifier si le code existe et est valide
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('verification_code', verificationCode)
        .eq('status', 'pending')
        .single();
        
      if (error || !data) {
        throw new Error("Code de retrait invalide ou déjà utilisé");
      }
      
      // S'assurer que l'agent n'est pas l'utilisateur qui a fait la demande
      if (data.user_id === user?.id) {
        throw new Error("Vous ne pouvez pas confirmer votre propre retrait");
      }

      // Calculer les frais (2% pour les retraits)
      const fee = data.amount * 0.02;
      
      // Mettre à jour le statut du retrait
      await supabase
        .from('withdrawals')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);
      
      // Ajouter le montant (moins les frais) au compte de l'agent
      await supabase.rpc('increment_balance', {
        user_id: user?.id,
        amount: data.amount - fee
      });
      
      // Créditer les frais au compte administrateur
      const { data: adminData } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', '+221773637752')
        .single();
      
      if (adminData) {
        await supabase.rpc('increment_balance', {
          user_id: adminData.id,
          amount: fee
        });
      }
      
      toast({
        title: "Retrait confirmé",
        description: `Le retrait de ${formatCurrency(data.amount, userCurrency)} a été effectué avec succès`,
      });
      
      // Réinitialiser le code de vérification
      setVerificationCode("");
      
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

        {/* Tabs pour les différentes opérations */}
        <Tabs defaultValue="recharge" className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="recharge" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Recharge
            </TabsTrigger>
            <TabsTrigger value="withdrawal" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Retrait
            </TabsTrigger>
          </TabsList>
          
          {/* Onglet pour les recharges */}
          <TabsContent value="recharge" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Confirmer une recharge</CardTitle>
                <CardDescription>
                  Entrez le code fourni par l'utilisateur pour confirmer sa recharge
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rechargeCode">Code de recharge</Label>
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
                  onClick={handleVerifyRecharge}
                  disabled={verificationCode.length !== 6 || isProcessing}
                >
                  {isProcessing ? "Traitement en cours..." : "Confirmer la recharge"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Onglet pour les retraits */}
          <TabsContent value="withdrawal" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Confirmer un retrait</CardTitle>
                <CardDescription>
                  Entrez le code fourni par l'utilisateur pour confirmer son retrait
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Historique des transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des opérations</CardTitle>
          </CardHeader>
          <CardContent>
            {isTransactionsLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              </div>
            ) : recentTransactions && recentTransactions.length > 0 ? (
              <div className="space-y-2">
                {recentTransactions.map((transaction, index) => (
                  <div key={transaction.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {transaction.type === 'recharge' ? 'Recharge' : 'Retrait'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.updated_at || transaction.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className={`font-bold ${transaction.type === 'recharge' ? 'text-red-600' : 'text-emerald-600'}`}>
                      {transaction.type === 'recharge' ? '-' : '+'} {formatCurrency(transaction.amount, userCurrency)}
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
