
import { supabase } from "@/integrations/supabase/client";

export interface WithdrawalRequestData {
  user_id: string;
  agent_id: string;
  agent_name: string;
  agent_phone: string;
  amount: number;
  withdrawal_phone: string;
}

export const createWithdrawalRequest = async (requestData: WithdrawalRequestData) => {
  console.log("🔄 Création d'une demande de retrait:", requestData);

  // Créer la demande de retrait avec le statut "pending"
  const { data: request, error: requestError } = await supabase
    .from('withdrawal_requests')
    .insert({
      user_id: requestData.user_id,
      agent_id: requestData.agent_id,
      agent_name: requestData.agent_name,
      agent_phone: requestData.agent_phone,
      amount: requestData.amount,
      withdrawal_phone: requestData.withdrawal_phone,
      status: 'pending'
    })
    .select()
    .single();

  if (requestError) {
    console.error("❌ Erreur lors de la création de la demande:", requestError);
    throw new Error("Erreur lors de la création de la demande de retrait");
  }

  console.log("✅ Demande de retrait créée:", request);
  return request;
};

export const processApprovedWithdrawal = async (requestId: string) => {
  console.log("🔄 Traitement du retrait approuvé:", requestId);

  // Récupérer les détails de la demande approuvée
  const { data: request, error: fetchError } = await supabase
    .from('withdrawal_requests')
    .select('*')
    .eq('id', requestId)
    .eq('status', 'approved')
    .single();

  if (fetchError || !request) {
    console.error("❌ Demande introuvable ou non approuvée:", fetchError);
    throw new Error("Demande de retrait introuvable ou non approuvée");
  }

  // Vérifier le solde de l'utilisateur
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', request.user_id)
    .single();

  if (profileError || !userProfile) {
    console.error("❌ Utilisateur introuvable:", profileError);
    throw new Error("Utilisateur introuvable");
  }

  if (userProfile.balance < request.amount) {
    console.error("❌ Solde insuffisant:", userProfile.balance, "vs", request.amount);
    throw new Error("Solde insuffisant pour effectuer le retrait");
  }

  // Débiter l'utilisateur
  const { error: debitError } = await supabase.rpc('increment_balance', {
    user_id: request.user_id,
    amount: -request.amount
  });

  if (debitError) {
    console.error("❌ Erreur lors du débit de l'utilisateur:", debitError);
    throw new Error("Erreur lors du débit du compte utilisateur");
  }

  // Créditer l'agent
  const { error: creditError } = await supabase.rpc('increment_balance', {
    user_id: request.agent_id,
    amount: request.amount
  });

  if (creditError) {
    console.error("❌ Erreur lors du crédit de l'agent:", creditError);
    // Recréditer l'utilisateur en cas d'erreur
    await supabase.rpc('increment_balance', {
      user_id: request.user_id,
      amount: request.amount
    });
    throw new Error("Erreur lors du crédit du compte agent");
  }

  // Créer l'enregistrement du retrait
  const { error: withdrawalError } = await supabase
    .from('withdrawals')
    .insert({
      user_id: request.user_id,
      amount: request.amount,
      withdrawal_phone: request.withdrawal_phone,
      status: 'completed'
    });

  if (withdrawalError) {
    console.error("❌ Erreur lors de l'enregistrement du retrait:", withdrawalError);
  }

  // Marquer la demande comme traitée
  const { error: updateError } = await supabase
    .from('withdrawal_requests')
    .update({ 
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', requestId);

  if (updateError) {
    console.error("❌ Erreur lors de la mise à jour de la demande:", updateError);
  }

  console.log("✅ Retrait traité avec succès");
  return {
    success: true,
    amount: request.amount,
    userName: request.user_id
  };
};
