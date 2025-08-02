import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AutomaticBill {
  id: string;
  bill_name: string;
  amount: number;
  due_date: string;
  recurrence: string;
  is_automated: boolean;
  priority: number;
  status: string;
  last_payment_date?: string;
  next_due_date?: string;
  payment_attempts: number;
  max_attempts: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface PaymentResult {
  success: boolean;
  message: string;
  amount?: number;
  new_balance?: number;
}

interface BillPaymentHistory {
  id: string;
  bill_id: string;
  amount: number;
  payment_date: string;
  status: string;
  balance_before: number;
  balance_after?: number;
  attempt_number: number;
  error_message?: string;
}

export const useAutomaticBills = () => {
  const [bills, setBills] = useState<AutomaticBill[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<BillPaymentHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchBills = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('automatic_bills')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBills(data || []);
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les factures automatiques",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async (billId?: string) => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('bill_payment_history')
        .select('*')
        .eq('user_id', user.id)
        .order('payment_date', { ascending: false });

      if (billId) {
        query = query.eq('bill_id', billId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPaymentHistory(data || []);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique des paiements",
        variant: "destructive"
      });
    }
  };

  const createBill = async (billData: Omit<AutomaticBill, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'payment_attempts' | 'max_attempts'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('automatic_bills')
        .insert({
          ...billData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      await fetchBills();
      toast({
        title: "Succès",
        description: "Facture automatique créée avec succès",
        variant: "default"
      });

      return data;
    } catch (error) {
      console.error('Error creating bill:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la facture automatique",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateBill = async (billId: string, updates: Partial<AutomaticBill>) => {
    try {
      const { error } = await supabase
        .from('automatic_bills')
        .update(updates)
        .eq('id', billId)
        .eq('user_id', user?.id);

      if (error) throw error;

      await fetchBills();
      toast({
        title: "Succès",
        description: "Facture mise à jour avec succès",
        variant: "default"
      });
    } catch (error) {
      console.error('Error updating bill:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la facture",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteBill = async (billId: string) => {
    try {
      const { error } = await supabase
        .from('automatic_bills')
        .delete()
        .eq('id', billId)
        .eq('user_id', user?.id);

      if (error) throw error;

      await fetchBills();
      toast({
        title: "Succès",
        description: "Facture supprimée avec succès",
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la facture",
        variant: "destructive"
      });
      throw error;
    }
  };

  const toggleAutomation = async (billId: string, isAutomated: boolean) => {
    await updateBill(billId, { is_automated: isAutomated });
  };

  const payBillManually = async (billId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('process_automatic_bill_payment', { bill_id_param: billId });

      if (error) throw error;

      const result = data as unknown as PaymentResult;
      if (result.success) {
        toast({
          title: "Paiement effectué",
          description: `Facture payée: ${result.amount?.toLocaleString()} XAF`,
          variant: "default"
        });
      } else {
        toast({
          title: "Paiement échoué",
          description: result.message,
          variant: "destructive"
        });
      }

      await fetchBills();
      await fetchPaymentHistory();
      
      return data;
    } catch (error) {
      console.error('Error paying bill manually:', error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter le paiement",
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchBills();
      fetchPaymentHistory();
    }
  }, [user]);

  return {
    bills,
    paymentHistory,
    loading,
    createBill,
    updateBill,
    deleteBill,
    toggleAutomation,
    payBillManually,
    fetchBills,
    fetchPaymentHistory
  };
};