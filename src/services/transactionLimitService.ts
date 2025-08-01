import { supabase } from '@/integrations/supabase/client';

interface MonthlyLimit {
  user_id: string;
  month: number;
  year: number;
  total_sent: number;
  limit: number;
}

const MONTHLY_LIMIT = 2000000; // 2,000,000 XAF par mois

export const transactionLimitService = {
  async checkMonthlyLimit(userId: string, amount: number): Promise<{ canTransfer: boolean; remaining: number; message?: string }> {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Calculer le total envoyé ce mois-ci
      const { data: transfers, error } = await supabase
        .from('transfers')
        .select('amount')
        .eq('sender_id', userId)
        .gte('created_at', new Date(currentYear, currentMonth - 1, 1).toISOString())
        .lt('created_at', new Date(currentYear, currentMonth, 1).toISOString())
        .eq('status', 'completed');

      if (error) {
        console.error('Erreur lors de la vérification des limites:', error);
        return { canTransfer: false, remaining: 0, message: 'Erreur de vérification' };
      }

      const totalSent = transfers?.reduce((sum, transfer) => sum + Number(transfer.amount), 0) || 0;
      const remaining = MONTHLY_LIMIT - totalSent;

      if (totalSent + amount > MONTHLY_LIMIT) {
        return {
          canTransfer: false,
          remaining,
          message: `Limite mensuelle dépassée. Vous avez envoyé ${totalSent.toLocaleString()} XAF ce mois-ci. Limite: ${MONTHLY_LIMIT.toLocaleString()} XAF`
        };
      }

      return {
        canTransfer: true,
        remaining: remaining - amount
      };
    } catch (error) {
      console.error('Erreur lors de la vérification des limites:', error);
      return { canTransfer: false, remaining: 0, message: 'Erreur système' };
    }
  },

  async getMonthlyStats(userId: string): Promise<{ totalSent: number; remaining: number; percentUsed: number }> {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      const { data: transfers, error } = await supabase
        .from('transfers')
        .select('amount')
        .eq('sender_id', userId)
        .gte('created_at', new Date(currentYear, currentMonth - 1, 1).toISOString())
        .lt('created_at', new Date(currentYear, currentMonth, 1).toISOString())
        .eq('status', 'completed');

      if (error) throw error;

      const totalSent = transfers?.reduce((sum, transfer) => sum + Number(transfer.amount), 0) || 0;
      const remaining = MONTHLY_LIMIT - totalSent;
      const percentUsed = (totalSent / MONTHLY_LIMIT) * 100;

      return { totalSent, remaining, percentUsed };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return { totalSent: 0, remaining: MONTHLY_LIMIT, percentUsed: 0 };
    }
  }
};