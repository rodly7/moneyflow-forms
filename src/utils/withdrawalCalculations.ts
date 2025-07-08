
export const calculateWithdrawalFees = (withdrawalAmount: number) => {
  const totalFeeRate = 0.015; // 1.5% total pour les retraits
  const totalFee = withdrawalAmount * totalFeeRate;
  const agentCommission = withdrawalAmount * 0.005; // 0.5% pour l'agent
  const platformCommission = withdrawalAmount * 0.01; // 1% pour l'entreprise

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
