import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  date: Date;
  description: string;
  currency: string;
  status: string;
  userType?: 'agent' | 'user';
}

interface Withdrawal {
  id: string;
  amount: number;
  created_at: string;
  withdrawal_phone: string;
  status: string;
  verification_code?: string;
  userType?: 'agent' | 'user';
}

export const useRealtimeTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      // Récupérer les transferts récents
      const { data: transfersData } = await supabase
        .from('transfers')
        .select(`
          id, 
          amount, 
          created_at, 
          recipient_full_name, 
          status,
          sender_id,
          profiles!transfers_sender_id_fkey(role)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      // Récupérer les retraits récents
      const { data: withdrawalsData } = await supabase
        .from('withdrawals')
        .select(`
          id, 
          amount, 
          created_at, 
          withdrawal_phone, 
          status, 
          verification_code,
          user_id,
          profiles!withdrawals_user_id_fkey(role)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      // Transformer les transferts
      const transformedTransfers: Transaction[] = (transfersData || []).map(transfer => ({
        id: transfer.id,
        type: 'transfer',
        amount: transfer.amount,
        date: new Date(transfer.created_at),
        description: `Transfert vers ${transfer.recipient_full_name}`,
        currency: 'XAF',
        status: transfer.status,
        userType: (transfer.profiles as any)?.role === 'agent' ? 'agent' : 'user'
      }));

      // Transformer les retraits
      const transformedWithdrawals: Withdrawal[] = (withdrawalsData || []).map(withdrawal => ({
        id: withdrawal.id,
        amount: withdrawal.amount,
        created_at: withdrawal.created_at,
        withdrawal_phone: withdrawal.withdrawal_phone,
        status: withdrawal.status,
        verification_code: withdrawal.verification_code,
        userType: (withdrawal.profiles as any)?.role === 'agent' ? 'agent' : 'user'
      }));

      setTransactions(transformedTransfers);
      setWithdrawals(transformedWithdrawals);
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();

    // Écouter les changements en temps réel pour les transferts
    const transfersChannel = supabase
      .channel('realtime-transfers')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transfers'
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    // Écouter les changements en temps réel pour les retraits
    const withdrawalsChannel = supabase
      .channel('realtime-withdrawals')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawals'
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(transfersChannel);
      supabase.removeChannel(withdrawalsChannel);
    };
  }, []);

  const deleteTransaction = async (id: string, type: string) => {
    try {
      if (type === 'withdrawal') {
        await supabase
          .from('withdrawals')
          .update({ is_deleted: true })
          .eq('id', id);
      } else {
        await supabase
          .from('transfers')
          .update({ is_deleted: true })
          .eq('id', id);
      }
      
      // Rafraîchir les données
      fetchTransactions();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  return {
    transactions,
    withdrawals,
    isLoading,
    refetch: fetchTransactions,
    deleteTransaction
  };
};