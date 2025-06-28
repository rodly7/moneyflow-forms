
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
      console.log(`📊 Génération du rapport ${period} pour l'agent:`, user.id);
      
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

      console.log(`📅 Période de rapport: ${startDate.toISOString()} à ${endDate.toISOString()}`);

      // Récupérer les transferts de l'agent
      const { data: transfers, error: transfersError } = await supabase
        .from('transfers')
        .select('amount, fees, created_at')
        .eq('sender_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (transfersError) {
        console.error('❌ Erreur transferts:', transfersError);
        throw transfersError;
      }

      // Récupérer les retraits de l'agent
      const { data: withdrawals, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('amount, created_at')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (withdrawalsError) {
        console.error('❌ Erreur retraits:', withdrawalsError);
        throw withdrawalsError;
      }

      // Récupérer les dépôts/recharges
      const { data: deposits, error: depositsError } = await supabase
        .from('recharges')
        .select('amount, created_at')
        .eq('provider_transaction_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (depositsError) {
        console.error('❌ Erreur dépôts:', depositsError);
        // Ne pas faire échouer le rapport si les dépôts ne sont pas disponibles
      }

      // Récupérer le solde actuel
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('❌ Erreur profil:', profileError);
        throw profileError;
      }

      const transfersData = transfers || [];
      const withdrawalsData = withdrawals || [];
      const depositsData = deposits || [];
      const currentBalance = profile?.balance || 0;

      // Calculer les commissions (approximation basée sur les frais)
      const totalCommissions = transfersData.reduce((sum, t) => sum + (Number(t.fees) || 0), 0);

      const amountToAdd = Math.max(0, TARGET_BALANCE - currentBalance);

      const reportData: AgentReportData = {
        period,
        totalTransfers: transfersData.length,
        totalWithdrawals: withdrawalsData.length,
        totalDeposits: depositsData.length,
        currentBalance,
        amountToAdd,
        totalCommissions,
        startDate,
        endDate
      };

      console.log(`✅ Rapport ${period} généré:`, reportData);
      return reportData;
    } catch (error) {
      console.error(`❌ Erreur lors de la génération du rapport ${period}:`, error);
      throw error;
    }
  };

  const generateAllReports = async () => {
    if (!user?.id) {
      console.log('⚠️ Pas d\'utilisateur connecté pour générer les rapports');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Génération de tous les rapports pour l\'agent:', user.id);
      
      const periods: ('daily' | 'weekly' | 'monthly' | 'yearly')[] = ['daily', 'weekly', 'monthly', 'yearly'];
      const reportPromises = periods.map(period => generateReport(period));
      const results = await Promise.all(reportPromises);
      
      const validReports = results.filter((report): report is AgentReportData => report !== null);
      setReports(validReports);
      
      console.log('✅ Tous les rapports générés avec succès:', validReports.length);
    } catch (error) {
      console.error('❌ Erreur lors de la génération des rapports:', error);
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const getReportByPeriod = (period: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    return reports.find(report => report.period === period);
  };

  // Auto-génération des rapports au chargement et toutes les heures
  useEffect(() => {
    if (user?.id) {
      console.log('🚀 Initialisation des rapports automatiques pour:', user.id);
      generateAllReports();
      
      // Programmer la génération automatique des rapports toutes les heures
      const interval = setInterval(() => {
        console.log('⏰ Génération automatique des rapports');
        generateAllReports();
      }, 60 * 60 * 1000); // Toutes les heures

      return () => {
        console.log('🛑 Nettoyage de l\'intervalle des rapports');
        clearInterval(interval);
      };
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
