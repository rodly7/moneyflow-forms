
import { supabase } from "@/integrations/supabase/client";

export const fetchWithdrawalByCode = async (verificationCode: string, userId: string) => {
  const { data: withdrawalData, error: withdrawalError } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('verification_code', verificationCode)
    .eq('user_id', userId)
    .eq('status', 'agent_pending')
    .maybeSingle();

  if (withdrawalError) {
    console.error("Erreur lors de la recherche du retrait:", withdrawalError);
    throw new Error("Erreur de base de données lors de la vérification du code");
  }

  if (!withdrawalData) {
    throw new Error("Ce code de vérification n'existe pas ou a déjà été utilisé");
  }

  return withdrawalData;
};

export const getUserBalance = async (userId: string) => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('balance, full_name, phone, country')
    .eq('id', userId)
    .single();

  if (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    throw new Error("Impossible de récupérer les informations du profil");
  }

  return {
    balance: Number(profile.balance) || 0,
    fullName: profile.full_name || '',
    phone: profile.phone || '',
    country: profile.country || 'Congo Brazzaville'
  };
};

export const updateWithdrawalStatus = async (withdrawalId: string, status: string) => {
  const { error: updateError } = await supabase
    .from('withdrawals')
    .update({ 
      status: status,
      updated_at: new Date().toISOString()
    })
    .eq('id', withdrawalId);

  if (updateError) {
    console.error("Erreur lors de la mise à jour:", updateError);
    throw new Error("Erreur lors de la finalisation du retrait");
  }
};

export const validateUserBalance = async (userId: string, withdrawalAmount: number) => {
  const balanceData = await getUserBalance(userId);
  const currentBalance = balanceData.balance;
  
  if (currentBalance < withdrawalAmount) {
    throw new Error(`Solde insuffisant. Solde disponible: ${currentBalance} FCFA, montant demandé: ${withdrawalAmount} FCFA`);
  }
  
  return {
    currentBalance,
    withdrawalAmount,
    remainingBalance: currentBalance - withdrawalAmount
  };
};
