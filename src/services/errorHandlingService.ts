
export const errorHandlingService = {
  handleAuthError(error: any): string {
    if (error?.message?.includes('Invalid login credentials')) {
      return 'Identifiants de connexion invalides. Vérifiez votre numéro de téléphone et mot de passe.';
    }
    if (error?.message?.includes('User already registered')) {
      return 'Un compte existe déjà avec ce numéro de téléphone. Essayez de vous connecter.';
    }
    if (error?.message?.includes('Email not confirmed')) {
      return 'Veuillez confirmer votre email avant de vous connecter.';
    }
    return error?.message || 'Une erreur est survenue lors de l\'authentification.';
  },

  handleTransferError(error: any): string {
    if (error?.message?.includes('Insufficient funds')) {
      return 'Solde insuffisant pour effectuer ce transfert.';
    }
    if (error?.message?.includes('User not found')) {
      return 'Destinataire introuvable.';
    }
    return error?.message || 'Une erreur est survenue lors du transfert.';
  },

  handleWithdrawalError(error: any): string {
    if (error?.message?.includes('Insufficient balance')) {
      return 'Solde insuffisant pour effectuer ce retrait.';
    }
    if (error?.message?.includes('Invalid verification code')) {
      return 'Code de vérification invalide ou expiré.';
    }
    return error?.message || 'Une erreur est survenue lors du retrait.';
  }
};
