
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

export const fetchUserBalance = async (userId: string) => {
  console.log("Récupération du solde depuis la table profiles pour l'utilisateur:", userId);
  
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('balance, full_name, id')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error("Erreur lors de la récupération du profil:", profileError);
    throw new Error("Impossible de vérifier votre solde dans la base de données");
  }

  if (!userProfile) {
    console.error("Profil utilisateur introuvable pour l'ID:", userId);
    throw new Error("Profil utilisateur introuvable");
  }

  const balance = Number(userProfile.balance) || 0;
  console.log(`Solde récupéré pour ${userProfile.full_name || 'utilisateur inconnu'}: ${balance} FCFA`);
  
  return balance;
};

export const findAvailableAgent = async () => {
  const { data, error } = await supabase
    .from('agents')
    .select('user_id')
    .eq('status', 'active')
    .limit(1);

  if (error || !data || data.length === 0) {
    throw new Error("Aucun agent trouvé pour traiter le retrait");
  }

  return data[0].user_id;
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

export const updateWithdrawalStatusByCode = async (verificationCode: string, userId: string, status: string) => {
  const { error: updateError } = await supabase
    .from('withdrawals')
    .update({ 
      status: status,
      updated_at: new Date().toISOString()
    })
    .eq('verification_code', verificationCode)
    .eq('user_id', userId)
    .eq('status', 'agent_pending');

  if (updateError) {
    throw updateError;
  }
};

// Nouvelle fonction pour vérifier le solde avant retrait
export const validateUserBalanceForWithdrawal = async (userId: string, withdrawalAmount: number) => {
  console.log(`Validation du solde pour retrait - Utilisateur: ${userId}, Montant: ${withdrawalAmount} FCFA`);
  
  const currentBalance = await fetchUserBalance(userId);
  
  if (currentBalance < withdrawalAmount) {
    const errorMessage = `Solde insuffisant. Solde disponible: ${currentBalance} FCFA, montant demandé: ${withdrawalAmount} FCFA`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  
  console.log(`✓ Solde suffisant pour le retrait. Solde: ${currentBalance} FCFA, Retrait: ${withdrawalAmount} FCFA`);
  return {
    currentBalance,
    withdrawalAmount,
    remainingBalance: currentBalance - withdrawalAmount
  };
};
