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
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-100 relative overflow-hidden">
        {/* Enhanced Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10 flex flex-col items-center space-y-6 p-8">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-500/30 border-t-blue-500 shadow-lg"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 animate-pulse"></div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-blue-600 font-semibold text-xl">Chargement en cours</p>
            <p className="text-gray-500">Préparation de votre espace...</p>
          </div>
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
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-100 relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-300/10 to-blue-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 w-full mx-auto space-y-4 px-0 pb-8">
        {/* Enhanced Header Section */}
        <div className="backdrop-blur-xl bg-white/80 border-b border-white/50 px-4 pt-8 pb-4 shadow-xl">
          {profile && <ProfileHeader profile={profile} />}
        </div>

        {/* Enhanced Balance Card */}
        {profile && (
          <div className="px-4">
            <div className="backdrop-blur-xl bg-white/70 rounded-3xl p-1 shadow-2xl border border-white/40">
              <BalanceCard 
                balance={profile.balance} 
                userCountry={userCountry}
                currency={userCurrency}
              />
            </div>
          </div>
        )}

        {/* Enhanced Transfer Form or Action Buttons */}
        {showTransfer ? (
          <div className="px-4">
            <div className="backdrop-blur-xl bg-white/90 rounded-3xl shadow-2xl p-8 border border-white/50">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Nouveau transfert</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowTransfer(false)}
                  className="rounded-full px-8 py-3 hover:bg-blue-50 transition-all duration-200 border-2 border-blue-200 hover:border-blue-300"
                >
                  ← Retour
                </Button>
              </div>
              <TransferForm />
            </div>
          </div>
        ) : (
          <div className="px-4">
            <div className="backdrop-blur-xl bg-white/70 rounded-3xl p-8 shadow-2xl border border-white/40">
              <ActionButtons onTransferClick={() => setShowTransfer(true)} />
            </div>
          </div>
        )}

        {/* Enhanced Transactions Card */}
        <div className="px-4">
          <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/40 overflow-hidden">
            <TransactionsCard 
              transactions={allTransactions}
              withdrawals={processedWithdrawals}
              onDeleteTransaction={handleDeleteTransaction}
            />
          </div>
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
