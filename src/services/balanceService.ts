
import { supabase } from "@/integrations/supabase/client";
import { creditTransactionFees } from "./feeService";

export const debitUserBalance = async (userId: string, amount: number): Promise<number> => {
  const { data: newBalance, error: deductError } = await supabase.rpc('increment_balance', {
    user_id: userId,
    amount: -amount
  });

  if (deductError) {
    console.error("Erreur lors du débit:", deductError);
    throw new Error("Erreur lors du débit de votre compte");
  }

  return Number(newBalance) || 0;
};

export const creditUserBalance = async (userId: string, amount: number): Promise<number> => {
  const { data: newBalance, error: creditError } = await supabase.rpc('increment_balance', {
    user_id: userId,
    amount: amount
  });

  if (creditError) {
    console.error("Erreur lors du crédit:", creditError);
    throw new Error("Erreur lors du crédit du compte");
  }

  return Number(newBalance) || 0;
};

export const creditPlatformCommission = async (commission: number): Promise<number | null> => {
  // Utiliser le service sécurisé pour créditer la commission
  const { secureCreditPlatformCommission } = await import('./secureBalanceService');
  return await secureCreditPlatformCommission(commission);
};

export const getUserBalance = async (userId: string): Promise<number> => {
  // Utiliser la fonction RPC pour récupérer le solde le plus à jour
  const { data: balance, error } = await supabase.rpc('increment_balance', {
    user_id: userId,
    amount: 0
  });

  if (error) {
    console.error("Erreur lors de la récupération du solde:", error);
    return 0;
  }

  return Number(balance) || 0;
};

// Nouvelle fonction pour traiter un transfert avec gestion automatique des frais
export const processTransferWithFees = async (
  senderId: string, 
  recipientId: string, 
  amount: number
): Promise<boolean> => {
  try {
    // Utiliser les fonctions sécurisées
    const { secureDebitUserBalance, secureCreditUserBalance } = await import('./secureBalanceService');
    
    // Débiter l'expéditeur
    await secureDebitUserBalance(senderId, amount, 'transfer_debit');
    
    // Créditer le destinataire
    await secureCreditUserBalance(recipientId, amount, 'transfer_credit');
    
    // Créditer automatiquement les frais sur le compte admin
    await creditTransactionFees('transfer', amount);
    
    return true;
  } catch (error) {
    console.error("Erreur lors du transfert avec frais:", error);
    throw error;
  }
};

// Nouvelle fonction pour traiter un retrait avec gestion automatique des frais
export const processWithdrawalWithFees = async (
  userId: string, 
  amount: number
): Promise<boolean> => {
  try {
    // Utiliser la fonction sécurisée
    const { secureDebitUserBalance } = await import('./secureBalanceService');
    
    // Débiter l'utilisateur
    await secureDebitUserBalance(userId, amount, 'withdrawal_debit');
    
    // Créditer automatiquement les frais sur le compte admin
    await creditTransactionFees('withdrawal', amount);
    
    return true;
  } catch (error) {
    console.error("Erreur lors du retrait avec frais:", error);
    throw error;
  }
};
