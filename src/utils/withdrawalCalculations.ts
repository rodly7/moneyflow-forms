
export const calculateWithdrawalFees = (withdrawalAmount: number) => {
  const agentCommission = withdrawalAmount * 0.005; // 0.5% pour l'agent
  const platformCommission = withdrawalAmount * 0.01; // 1% pour l'entreprise
  const totalFee = agentCommission + platformCommission; // Total = 1.5%

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
