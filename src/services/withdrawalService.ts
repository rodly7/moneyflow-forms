
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
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error("Erreur lors de la vérification du profil:", profileError);
    throw new Error("Impossible de vérifier votre solde");
  }

  if (!userProfile) {
    throw new Error("Profil utilisateur introuvable");
  }

  return Number(userProfile.balance) || 0;
};

export const findAvailableAgent = async () => {
  const { data: agentList, error: agentError } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'agent')
    .limit(1);

  if (agentError || !agentList || agentList.length === 0) {
    throw new Error("Aucun agent trouvé pour traiter le retrait");
  }

  return agentList[0].id;
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
