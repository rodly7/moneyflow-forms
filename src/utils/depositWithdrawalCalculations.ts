
export const calculateDepositFees = (amount: number) => {
  // Pas de frais pour les dépôts
  const totalFee = 0;
  const agentCommission = 0;
  const platformCommission = 0;

  return {
    totalFee,
    agentCommission,
    platformCommission
  };
};

export const calculateWithdrawalFees = (amount: number) => {
  // 1,5% de frais total pour les retraits (agent 0,5% + entreprise 1%)
  const feeRate = 0.015;
  const totalFee = Math.round(amount * feeRate);
  
  // L'agent reçoit 0,5% de commission
  const agentCommissionRate = 0.005;
  const agentCommission = Math.round(amount * agentCommissionRate);
  
  // L'entreprise reçoit 1% (le reste)
  const platformCommission = totalFee - agentCommission;

  return {
    totalFee,
    agentCommission,
    platformCommission
  };
};
