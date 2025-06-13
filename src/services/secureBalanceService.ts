
import { supabase } from "@/integrations/supabase/client";

export const secureDebitUserBalance = async (
  userId: string, 
  amount: number, 
  operationType: string = 'debit',
  performedBy?: string
): Promise<number> => {
  // Use the existing increment_balance function with negative amount
  const { data: newBalance, error: debitError } = await supabase.rpc('increment_balance', {
    user_id: userId,
    amount: -amount
  });

  if (debitError) {
    console.error("Erreur lors du débit sécurisé:", debitError);
    throw new Error("Erreur lors du débit de votre compte");
  }

  return Number(newBalance) || 0;
};

export const secureCreditUserBalance = async (
  userId: string, 
  amount: number, 
  operationType: string = 'credit',
  performedBy?: string
): Promise<number> => {
  // Use the existing increment_balance function
  const { data: newBalance, error: creditError } = await supabase.rpc('increment_balance', {
    user_id: userId,
    amount: amount
  });

  if (creditError) {
    console.error("Erreur lors du crédit sécurisé:", creditError);
    throw new Error("Erreur lors du crédit du compte");
  }

  return Number(newBalance) || 0;
};

export const checkTransactionLimit = async (
  userId: string,
  amount: number,
  operationType: string
): Promise<boolean> => {
  // For now, implement basic validation limits
  const basicLimits = {
    transfer: 500000,
    withdrawal: 200000,
    deposit: 2000000,
    agent_deposit: 2000000,
    agent_withdrawal: 2000000,
    admin_credit: 10000000
  };

  const limit = basicLimits[operationType as keyof typeof basicLimits] || 500000;
  
  if (amount > limit) {
    console.warn(`Transaction amount ${amount} exceeds limit ${limit} for ${operationType}`);
    return false;
  }

  return true;
};

export const secureCreditPlatformCommission = async (commission: number): Promise<number | null> => {
  // Find admin user by hardcoded phone number and credit them
  const { data: adminProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('phone', '+221773637752')
    .maybeSingle();

  if (profileError || !adminProfile) {
    console.error("Erreur lors de la recherche du profil admin:", profileError);
    return null;
  }

  const { data: newBalance, error } = await supabase.rpc('increment_balance', {
    user_id: adminProfile.id,
    amount: commission
  });

  if (error) {
    console.error("Erreur lors du crédit de la commission plateforme:", error);
    return null;
  }

  return Number(newBalance) || 0;
};
