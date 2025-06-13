
import { supabase } from "@/integrations/supabase/client";

export const secureDebitUserBalance = async (
  userId: string, 
  amount: number, 
  operationType: string = 'debit',
  performedBy?: string
): Promise<number> => {
  const { data: newBalance, error: debitError } = await supabase.rpc('increment_balance_secure', {
    user_id: userId,
    amount: -amount,
    operation_type: operationType,
    performed_by: performedBy || null
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
  const { data: newBalance, error: creditError } = await supabase.rpc('increment_balance_secure', {
    user_id: userId,
    amount: amount,
    operation_type: operationType,
    performed_by: performedBy || null
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
  const { data: isAllowed, error } = await supabase.rpc('check_transaction_limit', {
    user_id_param: userId,
    amount_param: amount,
    operation_type_param: operationType
  });

  if (error) {
    console.error("Erreur lors de la vérification des limites:", error);
    return false;
  }

  return Boolean(isAllowed);
};

export const secureCreditPlatformCommission = async (commission: number): Promise<number | null> => {
  const { data: newBalance, error } = await supabase.rpc('credit_platform_commission', {
    commission_amount: commission
  });

  if (error) {
    console.error("Erreur lors du crédit de la commission plateforme:", error);
    return null;
  }

  return Number(newBalance) || 0;
};
