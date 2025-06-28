
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface AgentReportData {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  totalTransfers: number;
  totalWithdrawals: number;
  totalDeposits: number;
  currentBalance: number;
  amountToAdd: number;
  totalCommissions: number;
  startDate: Date;
  endDate: Date;
}

export const useAgentReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<AgentReportData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const TARGET_BALANCE = 100000; // 100,000 FCFA

  const generateReport = async (period: 'daily' | 'weekly' | 'monthly' | 'yearly'): Promise<AgentReportData | null> => {
    if (!user?.id) return null;

    try {
      const now = new Date();
      let startDate: Date;
      let endDate = now;

      switch (period) {
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'weekly':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'yearly':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }

      // Récupérer toutes les données en parallèle
      const [transfersResult, withdrawalsResult, depositsResult, profileResult] = await Promise.all([
        supabase
          .from('transfers')
          .select('amount, fees, created_at')
          .eq('sender_id', user.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        
        supabase
          .from('withdrawals')
          .select('amount, created_at')
          .eq('user_id', user.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        
        supabase
          .from('recharges')
          .select('amount, created_at')
          .eq('provider_transaction_id', user.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        
        supabase
          .from('profiles')
          .select('balance')
          .eq('id', user.id)
          .single()
      ]);

      // Vérifier les erreurs
      if (transfersResult.error) throw transfersResult.error;
      if (withdrawalsResult.error) throw withdrawalsResult.error;
      if (depositsResult.error) throw depositsResult.error;
      if (profileResult.error) throw profileResult.error;

      const transfers = transfersResult.data || [];
      const withdrawals = withdrawalsResult.data || [];
      const deposits = depositsResult.data || [];
      const currentBalance = profileResult.data?.balance || 0;

      // Calculer les commissions (approximation basée sur les frais)
      const totalCommissions = transfers.reduce((sum, t) => sum + (Number(t.fees) || 0), 0);

      const amountToAdd = Math.max(0, TARGET_BALANCE - currentBalance);

      return {
        period,
        totalTransfers: transfers.length,
        totalWithdrawals: withdrawals.length,
        totalDeposits: deposits.length,
        currentBalance,
        amountToAdd,
        totalCommissions,
        startDate,
        endDate
      };
    } catch (error) {
      console.error(`Erreur lors de la génération du rapport ${period}:`, error);
      throw error;
    }
  };

  const generateAllReports = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const periods: ('daily' | 'weekly' | 'monthly' | 'yearly')[] = ['daily', 'weekly', 'monthly', 'yearly'];
      const reportPromises = periods.map(period => generateReport(period));
      const results = await Promise.all(reportPromises);
      
      const validReports = results.filter((report): report is AgentReportData => report !== null);
      setReports(validReports);
    } catch (error) {
      console.error('Erreur lors de la génération des rapports:', error);
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const getReportByPeriod = (period: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    return reports.find(report => report.period === period);
  };

  // Auto-génération des rapports quotidiens
  useEffect(() => {
    if (user?.id) {
      generateAllReports();
      
      // Programmer la génération automatique des rapports
      const interval = setInterval(() => {
        generateAllReports();
      }, 24 * 60 * 60 * 1000); // Chaque 24 heures

      return () => clearInterval(interval);
    }
  }, [user?.id]);

  return {
    reports,
    isLoading,
    error,
    generateReport,
    generateAllReports,
    getReportByPeriod
  };
};
