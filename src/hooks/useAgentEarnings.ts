import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AgentEarnings {
  totalVolume: number;
  totalTransactions: number;
  complaintsCount: number;
  commissionRate: number;
  baseCommission: number;
  volumeBonus: number;
  transactionBonus: number;
  noComplaintBonus: number;
  totalEarnings: number;
  tierName: string;
}

interface CommissionTier {
  minVolume: number;
  maxVolume: number | null;
  commissionRate: number;
  tierName: string;
}

interface MonthlyBonus {
  bonusType: string;
  requirementValue: number;
  bonusAmount: number;
  description: string;
}

export const useAgentEarnings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [earnings, setEarnings] = useState<AgentEarnings | null>(null);
  const [commissionTiers, setCommissionTiers] = useState<CommissionTier[]>([]);
  const [monthlyBonuses, setMonthlyBonuses] = useState<MonthlyBonus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEarnings = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      
      // Récupérer les performances mensuelles actuelles
      const { data: performanceData, error: performanceError } = await supabase
        .rpc('get_agent_current_month_performance', {
          agent_id_param: user.id
        });

      if (performanceError) {
        throw performanceError;
      }

      if (performanceData && performanceData.length > 0) {
        const data = performanceData[0];
        setEarnings({
          totalVolume: Number(data.total_volume) || 0,
          totalTransactions: data.total_transactions || 0,
          complaintsCount: data.complaints_count || 0,
          commissionRate: Number(data.commission_rate) || 0,
          baseCommission: Number(data.base_commission) || 0,
          volumeBonus: Number(data.volume_bonus) || 0,
          transactionBonus: Number(data.transaction_bonus) || 0,
          noComplaintBonus: Number(data.no_complaint_bonus) || 0,
          totalEarnings: Number(data.total_earnings) || 0,
          tierName: data.tier_name || 'Bronze'
        });
      } else {
        // Aucune donnée trouvée, initialiser avec des valeurs par défaut
        setEarnings({
          totalVolume: 0,
          totalTransactions: 0,
          complaintsCount: 0,
          commissionRate: 0.01,
          baseCommission: 0,
          volumeBonus: 0,
          transactionBonus: 0,
          noComplaintBonus: 0,
          totalEarnings: 0,
          tierName: 'Bronze'
        });
      }

      // Récupérer les paliers de commission
      const { data: tiersData, error: tiersError } = await supabase
        .from('commission_tiers')
        .select('*')
        .order('min_volume', { ascending: true });

      if (tiersError) {
        throw tiersError;
      }

      setCommissionTiers(tiersData.map(tier => ({
        minVolume: Number(tier.min_volume),
        maxVolume: tier.max_volume ? Number(tier.max_volume) : null,
        commissionRate: Number(tier.commission_rate),
        tierName: tier.tier_name
      })));

      // Récupérer les bonus mensuels
      const { data: bonusData, error: bonusError } = await supabase
        .from('monthly_bonuses')
        .select('*')
        .order('requirement_value', { ascending: true });

      if (bonusError) {
        throw bonusError;
      }

      setMonthlyBonuses(bonusData.map(bonus => ({
        bonusType: bonus.bonus_type,
        requirementValue: Number(bonus.requirement_value),
        bonusAmount: Number(bonus.bonus_amount),
        description: bonus.description || ''
      })));

    } catch (error) {
      console.error("Erreur lors du chargement des gains:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos gains mensuels",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getNextTierInfo = () => {
    if (!earnings) return null;

    const currentTierIndex = commissionTiers.findIndex(tier => 
      earnings.totalVolume >= tier.minVolume && 
      (tier.maxVolume === null || earnings.totalVolume <= tier.maxVolume)
    );

    const nextTier = commissionTiers[currentTierIndex + 1];
    if (!nextTier) return null;

    return {
      tierName: nextTier.tierName,
      requiredVolume: nextTier.minVolume,
      remainingVolume: nextTier.minVolume - earnings.totalVolume,
      commissionRate: nextTier.commissionRate
    };
  };

  const getBonusProgress = () => {
    if (!earnings) return [];

    return monthlyBonuses.map(bonus => {
      let current = 0;
      let achieved = false;

      switch (bonus.bonusType) {
        case 'transactions':
          current = earnings.totalTransactions;
          achieved = earnings.totalTransactions >= bonus.requirementValue;
          break;
        case 'volume':
          current = earnings.totalVolume;
          achieved = earnings.totalVolume >= bonus.requirementValue;
          break;
        case 'no_complaints':
          current = earnings.complaintsCount;
          achieved = earnings.complaintsCount <= bonus.requirementValue;
          break;
      }

      return {
        ...bonus,
        current,
        achieved,
        progress: bonus.bonusType === 'no_complaints' 
          ? (earnings.complaintsCount === 0 ? 100 : 0)
          : Math.min((current / bonus.requirementValue) * 100, 100)
      };
    });
  };

  useEffect(() => {
    fetchEarnings();
  }, [user]);

  return {
    earnings,
    commissionTiers,
    monthlyBonuses,
    isLoading,
    getNextTierInfo,
    getBonusProgress,
    refreshEarnings: fetchEarnings
  };
};