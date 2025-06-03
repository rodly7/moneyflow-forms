
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

export const ensureUserProfileExists = async (userId: string, userData?: any) => {
  console.log("🔍 Vérification de l'existence du profil pour l'utilisateur:", userId);
  
  // D'abord, vérifier si le profil existe
  const { data: existingProfile, error: checkError } = await supabase
    .from('profiles')
    .select('id, balance, full_name, phone, country')
    .eq('id', userId)
    .maybeSingle();

  if (checkError) {
    console.error("❌ Erreur lors de la vérification du profil:", checkError);
    throw new Error("Erreur lors de la vérification du profil utilisateur");
  }

  if (existingProfile) {
    console.log("✅ Profil existant trouvé:", existingProfile);
    return existingProfile;
  }

  // Si le profil n'existe pas, le créer
  console.log("📝 Création d'un nouveau profil pour l'utilisateur:", userId);
  
  const profileData = {
    id: userId,
    balance: 0,
    full_name: userData?.fullName || '',
    phone: userData?.email || '',
    country: userData?.country || 'Congo Brazzaville'
  };

  const { data: newProfile, error: createError } = await supabase
    .from('profiles')
    .insert(profileData)
    .select('id, balance, full_name, phone, country')
    .single();

  if (createError) {
    console.error("❌ Erreur lors de la création du profil:", createError);
    throw new Error("Impossible de créer le profil utilisateur");
  }

  console.log("✅ Nouveau profil créé avec succès:", newProfile);
  return newProfile;
};

export const fetchUserBalance = async (userId: string, userData?: any) => {
  console.log("🔄 Récupération du solde pour l'utilisateur:", userId);
  
  try {
    // S'assurer que le profil existe avant d'essayer de récupérer le solde
    const profile = await ensureUserProfileExists(userId, userData);
    
    const balance = Number(profile.balance) || 0;
    console.log(`✅ Solde récupéré pour ${profile.full_name || 'utilisateur'}: ${balance} FCFA`);
    
    return {
      balance,
      fullName: profile.full_name || '',
      phone: profile.phone || '',
      country: profile.country || 'Congo Brazzaville'
    };
  } catch (error) {
    console.error("❌ Erreur dans fetchUserBalance:", error);
    throw error;
  }
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
  
  const balanceData = await fetchUserBalance(userId);
  const currentBalance = balanceData.balance;
  
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
