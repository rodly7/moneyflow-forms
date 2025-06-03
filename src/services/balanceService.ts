
import { supabase } from "@/integrations/supabase/client";

export const debitUserBalance = async (userId: string, amount: number) => {
  const { error: deductError } = await supabase.rpc('increment_balance', {
    user_id: userId,
    amount: -amount
  });

  if (deductError) {
    console.error("Erreur lors du débit:", deductError);
    throw new Error("Erreur lors du débit de votre compte");
  }
};

export const creditUserBalance = async (userId: string, amount: number) => {
  const { error: creditError } = await supabase.rpc('increment_balance', {
    user_id: userId,
    amount: amount
  });

  if (creditError) {
    console.error("Erreur lors du crédit:", creditError);
    throw new Error("Erreur lors du crédit du compte");
  }
};

export const creditPlatformCommission = async (commission: number) => {
  const { data: adminData, error: adminError } = await supabase
    .from('profiles')
    .select('id')
    .eq('phone', '+221773637752')
    .maybeSingle();
    
  if (!adminError && adminData) {
    await supabase.rpc('increment_balance', {
      user_id: adminData.id,
      amount: commission
    });
  }
};
