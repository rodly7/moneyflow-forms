
export const calculateDepositFees = (depositAmount: number) => {
  // Les dépôts sont sans frais
  return {
    totalFee: 0,
    agentCommission: 0,
    platformCommission: 0
  };
};

export const calculateWithdrawalFees = (withdrawalAmount: number) => {
  const totalFeeRate = 0.015; // 1,5%
  const totalFee = withdrawalAmount * totalFeeRate;
  const agentCommission = totalFee / 3; // 1/3 pour l'agent (0,5%)
  const platformCommission = totalFee - agentCommission; // 2/3 pour la plateforme (1%)

  return {
    totalFee,
    agentCommission,
    platformCommission
  };
};

export const validateSufficientBalance = (currentBalance: number, amount: number) => {
  if (currentBalance < amount) {
    throw new Error(`Solde insuffisant. Solde actuel: ${currentBalance} FCFA, montant demandé: ${amount} FCFA`);
  }
};
