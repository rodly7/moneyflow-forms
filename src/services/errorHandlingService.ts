
import { AuthErrorHandler } from './authErrorHandler';

const ERROR_MESSAGES = {
  AUTH: {
    INVALID_CREDENTIALS: 'Identifiants de connexion invalides. Vérifiez votre numéro de téléphone et mot de passe.',
    USER_ALREADY_REGISTERED: 'Un compte existe déjà avec ce numéro de téléphone. Essayez de vous connecter.',
    EMAIL_NOT_CONFIRMED: 'Veuillez confirmer votre email avant de vous connecter.',
    SESSION_MISSING: 'Session expirée. Veuillez vous reconnecter.',
    DEFAULT: 'Une erreur est survenue lors de l\'authentification.'
  },
  TRANSFER: {
    INSUFFICIENT_FUNDS: 'Solde insuffisant pour effectuer ce transfert.',
    USER_NOT_FOUND: 'Destinataire introuvable.',
    DEFAULT: 'Une erreur est survenue lors du transfert.'
  },
  WITHDRAWAL: {
    INSUFFICIENT_BALANCE: 'Solde insuffisant pour effectuer ce retrait.',
    INVALID_VERIFICATION_CODE: 'Code de vérification invalide ou expiré.',
    DEFAULT: 'Une erreur est survenue lors du retrait.'
  },
  BIOMETRIC: {
    NOT_SUPPORTED: 'Authentification biométrique non supportée sur cet appareil.',
    NOT_ALLOWED: 'Authentification biométrique refusée par l\'utilisateur.',
    FAILED: 'Échec de l\'authentification biométrique. Utilisez votre mot de passe.',
    DEFAULT: 'Erreur d\'authentification biométrique.'
  }
} as const;

export const errorHandlingService = {
  async handleAuthError(error: any): Promise<string> {
    const message = error?.message || '';
    
    if (message.includes('Invalid login credentials')) {
      return ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS;
    }
    if (message.includes('User already registered')) {
      return ERROR_MESSAGES.AUTH.USER_ALREADY_REGISTERED;
    }
    if (message.includes('Email not confirmed')) {
      return ERROR_MESSAGES.AUTH.EMAIL_NOT_CONFIRMED;
    }
    if (message.includes('Auth session missing')) {
      await AuthErrorHandler.handleAuthError(error, 'auth_session');
      return ERROR_MESSAGES.AUTH.SESSION_MISSING;
    }
    
    return message || ERROR_MESSAGES.AUTH.DEFAULT;
  },

  handleTransferError(error: any): string {
    const message = error?.message || '';
    
    if (message.includes('Insufficient funds')) {
      return ERROR_MESSAGES.TRANSFER.INSUFFICIENT_FUNDS;
    }
    if (message.includes('User not found')) {
      return ERROR_MESSAGES.TRANSFER.USER_NOT_FOUND;
    }
    
    return message || ERROR_MESSAGES.TRANSFER.DEFAULT;
  },

  handleWithdrawalError(error: any): string {
    const message = error?.message || '';
    
    if (message.includes('Insufficient balance')) {
      return ERROR_MESSAGES.WITHDRAWAL.INSUFFICIENT_BALANCE;
    }
    if (message.includes('Invalid verification code')) {
      return ERROR_MESSAGES.WITHDRAWAL.INVALID_VERIFICATION_CODE;
    }
    
    return message || ERROR_MESSAGES.WITHDRAWAL.DEFAULT;
  },

  handleBiometricError(error: any): string {
    if (!error?.name) return ERROR_MESSAGES.BIOMETRIC.DEFAULT;
    
    switch (error.name) {
      case 'NotSupportedError':
        return ERROR_MESSAGES.BIOMETRIC.NOT_SUPPORTED;
      case 'NotAllowedError':
        return ERROR_MESSAGES.BIOMETRIC.NOT_ALLOWED;
      case 'InvalidStateError':
      case 'UnknownError':
        return ERROR_MESSAGES.BIOMETRIC.FAILED;
      default:
        return ERROR_MESSAGES.BIOMETRIC.DEFAULT;
    }
  }
};
