
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://msasycggbiwyxlczknwj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zYXN5Y2dnYml3eXhsY3prbndqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczNjU5MTMsImV4cCI6MjA1Mjk0MTkxM30.Ezb5GjSg8ApUWR5iNMvVS9bSA7oxudUuYOP2g2ugB_4";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: localStorage,
      storageKey: 'supabase.auth.token',
    }
  }
);

// Function to handle withdrawal operations
export const processWithdrawal = async (userId: string, amount: number, phoneNumber: string) => {
  try {
    // Check user balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile) {
      throw new Error("Impossible de vérifier votre solde");
    }
    
    if (profile.balance < amount) {
      throw new Error("Solde insuffisant pour effectuer ce retrait");
    }
    
    // Create withdrawal record
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawals')
      .insert({
        user_id: userId,
        amount: amount,
        withdrawal_phone: phoneNumber,
        status: 'pending'
      })
      .select()
      .single();
    
    if (withdrawalError) {
      throw withdrawalError;
    }
    
    // Update user balance
    const { error: balanceError } = await supabase
      .from('profiles')
      .update({ balance: profile.balance - amount })
      .eq('id', userId);
      
    if (balanceError) {
      throw new Error("Erreur lors de la mise à jour du solde");
    }
    
    return withdrawal;
  } catch (error) {
    throw error;
  }
};

// Function to process withdrawal verification and fund transfer
export const processWithdrawalVerification = async (withdrawalId: string, processorId: string) => {
  try {
    // Fetch the withdrawal details
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .eq('status', 'pending')
      .single();
    
    if (fetchError || !withdrawal) {
      throw new Error("Ce retrait n'existe pas ou a déjà été traité");
    }
    
    // Ensure the processor is different from the requester
    if (withdrawal.user_id === processorId) {
      throw new Error("Vous ne pouvez pas confirmer votre propre retrait");
    }
    
    // Update withdrawal status to 'completed'
    const { error: updateError } = await supabase
      .from('withdrawals')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', withdrawal.id);
    
    if (updateError) throw updateError;
    
    // Add funds to the processor's account
    const { error: balanceError } = await supabase
      .rpc('increment_balance', { 
        user_id: processorId, 
        amount: withdrawal.amount 
      });
    
    if (balanceError) {
      throw new Error("Erreur lors du transfert des fonds");
    }
    
    return withdrawal;
  } catch (error) {
    throw error;
  }
};
