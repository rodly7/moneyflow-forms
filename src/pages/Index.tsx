
import { useAuth } from "@/contexts/OptimizedAuthContext";
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
import { useWithdrawalRequestNotifications } from "@/hooks/useWithdrawalRequestNotifications";
import WithdrawalRequestNotification from "@/components/notifications/WithdrawalRequestNotification";

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
  
  // Notifications de retrait avec le nouveau système sécurisé
  const {
    selectedRequest,
    showSecureConfirmation,
    handleNotificationClick,
    handleSecureConfirm,
    handleSecureReject,
    closeSecureConfirmation
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

  // Récupérer seulement les 5 retraits les plus récents pour l'affichage
  const { data: withdrawals } = useQuery({
    queryKey: ['withdrawals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
  });

  // Récupérer seulement les 5 transferts les plus récents pour l'affichage
  const { data: transfers } = useQuery({
    queryKey: ['transfers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transfers')
        .select('*')
        .eq('sender_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
  });

  // Récupérer seulement les 5 transferts reçus les plus récents pour l'affichage
  const { data: receivedTransfers } = useQuery({
    queryKey: ['receivedTransfers'],
    queryFn: async () => {
      if (!profile?.phone) return [] as ReceivedTransfer[];
      
      const { data, error } = await supabase
        .from('transfers')
        .select('id, amount, created_at, sender_id, status')
        .eq('recipient_phone', profile.phone)
        .order('created_at', { ascending: false })
        .limit(5);
      
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
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent shadow-lg" />
          <p className="text-gray-600 font-medium">Chargement en cours...</p>
        </div>
      </div>
    );
  }
  
  const userCountry = profile?.country || "Cameroun";
  const userCurrency = getCurrencyForCountry(userCountry);
  
  // Afficher seulement les 3 transactions les plus récentes
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
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="w-full mx-auto space-y-2 px-0 pb-8">
        {/* Enhanced Header Section - espacement réduit */}
        <div className="bg-white/70 backdrop-blur-sm border-b border-gray-100 px-4 pt-6 pb-2 shadow-sm">
          {profile && <ProfileHeader profile={profile} />}
        </div>

        {/* Enhanced Balance Card - espacement réduit */}
        {profile && (
          <div className="px-4">
            <BalanceCard 
              balance={profile.balance} 
              userCountry={userCountry}
              currency={userCurrency}
            />
          </div>
        )}

        {/* Enhanced Transfer Form or Action Buttons - espacement réduit */}
        {showTransfer ? (
          <div className="px-4">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Nouveau transfert</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowTransfer(false)}
                  className="rounded-full px-6 hover:bg-gray-50 transition-all duration-200"
                >
                  ← Retour
                </Button>
              </div>
              <TransferForm />
            </div>
          </div>
        ) : (
          <div className="px-4">
            <ActionButtons onTransferClick={() => setShowTransfer(true)} />
          </div>
        )}

        {/* Enhanced Transactions Card - espacement réduit */}
        <div className="px-4">
          <TransactionsCard 
            transactions={allTransactions}
            withdrawals={processedWithdrawals}
            onDeleteTransaction={handleDeleteTransaction}
          />
        </div>
        
        {/* Notification de retrait sécurisée */}
        <WithdrawalRequestNotification
          isOpen={showSecureConfirmation}
          onClose={closeSecureConfirmation}
          onConfirm={handleSecureConfirm}
          onReject={handleSecureReject}
          requestData={selectedRequest}
        />
      </div>
    </div>
  );
};

export default Index;
