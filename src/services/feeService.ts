
import { supabase } from "@/integrations/supabase/client";

// Service pour gérer automatiquement les frais sur chaque transaction
export const creditTransactionFees = async (
  transactionType: 'transfer' | 'withdrawal',
  amount: number,
  performedBy?: 'agent' | 'user'
) => {
  try {
    console.log(`💰 Calcul des frais pour ${transactionType} de ${amount} FCFA`);
    
    let fees = 0;
    
    // Calcul des frais selon le type de transaction
    if (transactionType === 'transfer') {
      fees = amount * 0.065; // 6.5% pour les transferts (agent 1% + entreprise 5.5%)
    } else if (transactionType === 'withdrawal') {
      fees = amount * 0.015; // 1.5% pour les retraits (agent 0.5% + entreprise 1%)
    }
    
    if (fees > 0) {
      // Créditer les frais sur le compte admin (+221773637752)
      const { data: adminProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', '+221773637752')
        .maybeSingle();
      
      if (profileError || !adminProfile) {
        console.error("❌ Erreur lors de la recherche du profil admin:", profileError);
        return false;
      }
      
      // Utiliser la fonction RPC pour créditer les frais
      const { error: creditError } = await supabase.rpc('increment_balance', {
        user_id: adminProfile.id,
        amount: fees
      });
      
      if (creditError) {
        console.error("❌ Erreur lors du crédit des frais:", creditError);
        return false;
      }
      
      console.log(`✅ Frais de ${fees} FCFA crédités sur le compte admin`);
      return true;
    }
    
    return true;
  } catch (error) {
    console.error("❌ Erreur lors du traitement des frais:", error);
    return false;
  }
};

export const calculateTransactionFees = (
  transactionType: 'transfer' | 'withdrawal',
  amount: number
): number => {
  if (transactionType === 'transfer') {
    return amount * 0.065; // 6.5% pour les transferts (agent 1% + entreprise 5.5%)
  } else if (transactionType === 'withdrawal') {
    return amount * 0.015; // 1.5% pour les retraits (agent 0.5% + entreprise 1%)
  }
  return 0;
};
