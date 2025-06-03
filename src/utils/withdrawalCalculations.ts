
export const calculateWithdrawalFees = (withdrawalAmount: number) => {
  const totalFeeRate = 0.06;
  const totalFee = withdrawalAmount * totalFeeRate;
  const agentCommission = totalFee / 3; // 1/3 pour l'agent (2%)
  const platformCommission = totalFee - agentCommission; // 2/3 pour la plateforme (4%)

  return {
    totalFee,
    agentCommission,
    platformCommission
  };
};

export const validateSufficientBalance = (currentBalance: number, withdrawalAmount: number) => {
  if (currentBalance < withdrawalAmount) {
    throw new Error(`Solde insuffisant. Solde actuel: ${currentBalance} FCFA, montant demandé: ${withdrawalAmount} FCFA`);
  }
};
