
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase, getCurrencyForCountry, convertCurrency, formatCurrency } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import TransferForm from "@/components/TransferForm";
import { Button } from "@/components/ui/button";
import ProfileHeader from "@/components/dashboard/ProfileHeader";
import BalanceCard from "@/components/dashboard/BalanceCard";
import ActionButtons from "@/components/dashboard/ActionButtons";
import TransactionsCard from "@/components/dashboard/TransactionsCard";
import AutomaticWithdrawalConfirmation from "@/components/withdrawal/AutomaticWithdrawalConfirmation";
import { useWithdrawalConfirmations } from "@/hooks/useWithdrawalConfirmations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import WithdrawalRequestNotification from "@/components/notifications/WithdrawalRequestNotification";
import { useWithdrawalRequestNotifications } from "@/hooks/useWithdrawalRequestNotifications";

interface Profile {
  id: string;
  full_name: string | null;
  phone: string;
  balance: number;
  avatar_url?: string | null;
  country?: string | null;
  address?: string | null;
  created_at: string;
}

interface ReceivedTransfer {
  id: string;
  amount: number;
  created_at: string;
  sender_id: string;
  sender_name?: string | null;
  status: string;
}

const Index = () => {
  const { user, isAgent } = useAuth();
  const [showTransfer, setShowTransfer] = useState(false);
  const { toast } = useToast();

  // Utiliser le hook de confirmation de retrait
  const {
    pendingWithdrawals,
    selectedWithdrawal,
    showConfirmation,
    handleNotificationClick,
    handleConfirm,
    handleReject,
    closeConfirmation
  } = useWithdrawalConfirmations();

  // Utiliser le nouveau hook pour les demandes de retrait
  const {
    pendingRequests,
    selectedRequest,
    showNotification: showRequestNotification,
    handleConfirm: handleRequestConfirm,
    handleReject: handleRequestReject,
    closeNotification: closeRequestNotification,
    handleNotificationClick: handleRequestNotificationClick
  } = useWithdrawalRequestNotifications();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      return data as Profile;
    },
  });

  // Récupérer TOUS les retraits au lieu de les limiter
  const { data: withdrawals } = useQuery({
    queryKey: ['withdrawals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Récupérer TOUS les transferts au lieu de les limiter
  const { data: transfers } = useQuery({
    queryKey: ['transfers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transfers')
        .select('*')
        .eq('sender_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Récupérer TOUS les transferts reçus au lieu de les limiter
  const { data: receivedTransfers } = useQuery({
    queryKey: ['receivedTransfers'],
    queryFn: async () => {
      if (!profile?.phone) return [] as ReceivedTransfer[];
      
      const { data, error } = await supabase
        .from('transfers')
        .select('id, amount, created_at, sender_id, status')
        .eq('recipient_phone', profile.phone)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const senderIds = data.map(transfer => transfer.sender_id);
        const { data: senders } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', senderIds);
          
        if (senders) {
          const result = data.map(transfer => {
            const sender = senders.find(s => s.id === transfer.sender_id);
            return {
              ...transfer,
              sender_name: sender?.full_name || null
            };
          });
          return result as ReceivedTransfer[];
        }
      }
      return (data || []) as ReceivedTransfer[];
    },
    enabled: !!profile?.phone,
  });

  const handleDeleteTransaction = async (transactionId: string, type: string) => {
    try {
      const { error } = await supabase
        .from(type === 'withdrawal' ? 'withdrawals' : 'transfers')
        .update({ status: 'deleted' })
        .eq('id', transactionId);

      if (error) throw error;
      
      toast({
        title: "Transaction supprimée",
        description: "La transaction a été supprimée avec succès"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la transaction",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
    </div>;
  }
  
  const userCountry = profile?.country || "Cameroun";
  const userCurrency = getCurrencyForCountry(userCountry);
  
  // Afficher TOUTES les transactions au lieu de les limiter à 3
  const allTransactions = [
    ...(withdrawals?.map(w => ({
      id: w.id,
      type: 'withdrawal',
      amount: -convertCurrency(w.amount, "XAF", userCurrency),
      date: new Date(w.created_at),
      description: `Retrait vers ${w.withdrawal_phone}`,
      currency: userCurrency,
      status: w.status,
      verification_code: w.verification_code
    })) || []),
    ...(transfers?.map(t => ({
      id: t.id,
      type: 'transfer',
      amount: -convertCurrency(t.amount, "XAF", userCurrency),
      date: new Date(t.created_at),
      description: `Transfert à ${t.recipient_full_name}`,
      currency: userCurrency,
      status: t.status
    })) || []),
    ...(receivedTransfers?.map(rt => ({
      id: rt.id,
      type: 'received',
      amount: convertCurrency(rt.amount, "XAF", userCurrency),
      date: new Date(rt.created_at),
      description: `Réception de ${rt.sender_name || 'quelqu\'un'}`,
      currency: userCurrency,
      status: rt.status || 'completed'
    })) || [])
  ]
  .filter(t => t.status !== 'deleted')
  .sort((a, b) => b.date.getTime() - a.date.getTime());

  const processedWithdrawals = withdrawals?.map(w => ({
    ...w,
    amount: convertCurrency(w.amount, "XAF", userCurrency),
    currency: userCurrency
  })) || [];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20">
      <div className="w-full mx-auto space-y-4 px-0">
        {/* Header sans icône de notification */}
        <div className="px-4 pt-4">
          {profile && <ProfileHeader profile={profile} />}
        </div>

        {/* Section de confirmation de retrait pour les utilisateurs */}
        {!isAgent() && pendingWithdrawals.length > 0 && (
          <div className="px-4">
            <Card className="bg-orange-50 border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-orange-800 text-lg flex items-center gap-2">
                  🔔 Confirmation de retrait requise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-orange-700 text-sm">
                    Vous avez {pendingWithdrawals.length} retrait(s) en attente de confirmation.
                  </p>
                  <Button
                    onClick={handleNotificationClick}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    Confirmer le retrait de {pendingWithdrawals[0]?.amount} FCFA
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Section des demandes de retrait d'agents pour les utilisateurs */}
        {!isAgent() && pendingRequests.length > 0 && (
          <div className="px-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-blue-800 text-lg flex items-center gap-2">
                  🔔 Demande de retrait
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-blue-700 text-sm">
                    Un agent souhaite effectuer un retrait de {pendingRequests[0]?.amount} FCFA.
                  </p>
                  <p className="text-blue-600 text-xs">
                    Agent: {pendingRequests[0]?.agent_name}
                  </p>
                  <Button
                    onClick={handleRequestNotificationClick}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Voir la demande
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {profile && (
          <BalanceCard 
            balance={profile.balance} 
            userCountry={userCountry}
            currency={userCurrency}
          />
        )}

        {showTransfer ? (
          <div className="space-y-4 px-4">
            <Button
              variant="outline"
              onClick={() => setShowTransfer(false)}
              className="mb-4"
            >
              ← Retour
            </Button>
            <TransferForm />
          </div>
        ) : (
          <ActionButtons onTransferClick={() => setShowTransfer(true)} />
        )}

        <TransactionsCard 
          transactions={allTransactions}
          withdrawals={processedWithdrawals}
          onDeleteTransaction={handleDeleteTransaction}
        />

        {/* Modal de confirmation de retrait */}
        {showConfirmation && selectedWithdrawal && (
          <AutomaticWithdrawalConfirmation 
            withdrawal={selectedWithdrawal}
            onConfirm={handleConfirm}
            onReject={handleReject}
            onClose={closeConfirmation}
          />
        )}

        {/* Modal de demande de retrait d'agent */}
        {showRequestNotification && selectedRequest && (
          <WithdrawalRequestNotification
            request={selectedRequest}
            onConfirm={handleRequestConfirm}
            onReject={handleRequestReject}
            onClose={closeRequestNotification}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
