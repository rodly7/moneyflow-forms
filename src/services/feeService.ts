
import { supabase } from "@/integrations/supabase/client";

// Service pour gérer automatiquement les frais sur chaque transaction
export const creditTransactionFees = async (
  transactionType: 'transfer' | 'withdrawal' | 'deposit',
  amount: number,
  isNational: boolean = false,
  performedBy?: 'agent' | 'user'
) => {
  try {
    console.log(`💰 Calcul des frais pour ${transactionType} de ${amount} FCFA`);
    
    let fees = 0;
    
    // Calcul des frais selon le type de transaction
    if (transactionType === 'transfer') {
      fees = calculateTransactionFees('transfer', amount, isNational);
    } else if (transactionType === 'withdrawal') {
      // Pas de frais pour les clients sur les retraits
      fees = 0;
    } else if (transactionType === 'deposit') {
      // Pas de frais pour les dépôts
      fees = 0;
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
  transactionType: 'transfer' | 'withdrawal' | 'deposit',
  amount: number,
  isNational: boolean = false,
  performedBy?: 'agent' | 'user'
): number => {
  if (transactionType === 'transfer') {
    if (isNational) {
      return amount * 0.01; // 1% pour les transferts nationaux
    } else {
      // Transferts internationaux : frais progressifs
      if (amount < 350000) {
        return amount * 0.065; // 6,5%
      } else if (amount <= 750000) {
        return amount * 0.045; // 4,5%
      } else {
        return amount * 0.035; // 3,5%
      }
    }
  } else if (transactionType === 'withdrawal') {
    // Pas de frais pour les clients sur les retraits
    return 0;
  } else if (transactionType === 'deposit') {
    // Pas de frais sur les dépôts
    return 0;
  }
  return 0;
};
