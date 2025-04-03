
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import TransferForm from "@/components/TransferForm";
import { Button } from "@/components/ui/button";
import ProfileHeader from "@/components/dashboard/ProfileHeader";
import BalanceCard from "@/components/dashboard/BalanceCard";
import ActionButtons from "@/components/dashboard/ActionButtons";
import TransactionsCard from "@/components/dashboard/TransactionsCard";

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

const Index = () => {
  const { user } = useAuth();
  const [showTransfer, setShowTransfer] = useState(false);
  const { toast } = useToast();

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

  const { data: withdrawals } = useQuery({
    queryKey: ['withdrawals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: transfers } = useQuery({
    queryKey: ['transfers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transfers')
        .select('*')
        .eq('sender_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data;
    },
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

  const allTransactions = [
    ...(withdrawals?.map(w => ({
      id: w.id,
      type: 'withdrawal',
      amount: -w.amount,
      date: new Date(w.created_at),
      description: `Retrait vers ${w.withdrawal_phone}`,
      currency: 'XAF',
      status: w.status
    })) || []),
    ...(transfers?.map(t => ({
      id: t.id,
      type: 'transfer',
      amount: -t.amount,
      date: new Date(t.created_at),
      description: `Transfert à ${t.recipient_full_name}`,
      currency: 'XAF',
      status: t.status
    })) || [])
  ]
  .filter(t => t.status !== 'deleted')
  .sort((a, b) => b.date.getTime() - a.date.getTime())
  .slice(0, 3);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-4 px-0 sm:py-8 sm:px-0">
      <div className="container max-w-full mx-auto space-y-4">
        {profile && <ProfileHeader profile={profile} />}

        {profile && (
          <BalanceCard 
            balance={profile.balance} 
            avatar={profile.avatar_url || undefined} 
            userName={profile.full_name || ''}
          />
        )}

        {showTransfer ? (
          <div className="space-y-4 mx-4">
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
          withdrawals={withdrawals}
          onDeleteTransaction={handleDeleteTransaction}
        />
      </div>
    </div>
  );
};

export default Index;
