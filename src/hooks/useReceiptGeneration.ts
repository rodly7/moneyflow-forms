
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { generateReceipt, downloadReceipt } from "@/components/receipts/ReceiptGenerator";

interface TransactionData {
  id: string;
  type: 'transfer' | 'withdrawal' | 'deposit' | 'savings';
  amount: number;
  recipient_name?: string;
  recipient_phone?: string;
  fees?: number;
  status?: string;
}

export const useReceiptGeneration = () => {
  const { user, profile } = useAuth();

  const generateAndSaveReceipt = async (transaction: TransactionData) => {
    if (!user || !profile) return;

    try {
      // Sauvegarder les données du reçu en base
      const receiptData = {
        amount: transaction.amount,
        recipient_name: transaction.recipient_name,
        recipient_phone: transaction.recipient_phone,
        fees: transaction.fees,
        status: transaction.status || 'completed'
      };

      await supabase
        .from('transaction_receipts' as any)
        .insert({
          user_id: user.id,
          transaction_id: transaction.id,
          transaction_type: transaction.type,
          receipt_data: receiptData
        });

      // Générer et télécharger le PDF
      const userData = {
        full_name: profile.full_name || 'Utilisateur',
        phone: profile.phone,
        country: profile.country || 'Non défini'
      };

      const transactionForPDF = {
        ...transaction,
        created_at: new Date().toISOString(),
        status: transaction.status || 'completed'
      };

      const doc = generateReceipt(transactionForPDF, userData);
      downloadReceipt(doc, transaction.id);

    } catch (error) {
      console.error('Erreur lors de la génération du reçu:', error);
    }
  };

  return { generateAndSaveReceipt };
};
