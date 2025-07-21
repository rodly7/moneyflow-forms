
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = "https://msasycggbiwyxlczknwj.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zYXN5Y2dnYml3eXhsY3prbndqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczNjU5MTMsImV4cCI6MjA1Mjk0MTkxM30.Ezb5GjSg8ApUWR5iNMvVS9bSA7oxudUuYOP2g2ugB_4"

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Currency utilities
export const getCurrencyForCountry = (country: string): string => {
  const currencyMap: { [key: string]: string } = {
    // Afrique Centrale (XAF)
    'Cameroun': 'XAF',
    'Gabon': 'XAF',
    'Tchad': 'XAF',
    'République Centrafricaine': 'XAF',
    'Guinée Équatoriale': 'XAF',
    
    // Afrique de l'Ouest (XOF)
    'Congo Brazzaville': 'XOF',
    'Senegal': 'XOF',
    'Sénégal': 'XOF',
    'Côte d\'Ivoire': 'XOF',
    'Mali': 'XOF',
    'Burkina Faso': 'XOF',
    'Niger': 'XOF',
    'Bénin': 'XOF',
    'Togo': 'XOF',
    
    // Europe (EUR)
    'France': 'EUR',
    'Allemagne': 'EUR',
    'Italie': 'EUR',
    'Espagne': 'EUR',
    'Portugal': 'EUR',
    'Belgique': 'EUR',
    'Pays-Bas': 'EUR',
    'Autriche': 'EUR',
    'Irlande': 'EUR',
    'Grèce': 'EUR',
    'Finlande': 'EUR',
    'Luxembourg': 'EUR',
    
    // Canada (CAD)
    'Canada': 'CAD'
  };
  
  return currencyMap[country] || 'XAF';
};

export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  // Taux de change approximatifs par rapport au XAF (base)
  const exchangeRates: { [key: string]: number } = {
    'XAF': 1,        // Base
    'XOF': 1,        // XAF et XOF ont la même valeur (CFA francs)
    'EUR': 655.957,  // 1 EUR = ~656 XAF
    'CAD': 435.23    // 1 CAD = ~435 XAF
  };
  
  // Convertir d'abord vers XAF si nécessaire
  let amountInXAF: number;
  if (fromCurrency === 'XAF') {
    amountInXAF = amount;
  } else {
    amountInXAF = amount * exchangeRates[fromCurrency];
  }
  
  // Puis convertir vers la devise cible
  if (toCurrency === 'XAF') {
    return amountInXAF;
  } else {
    return amountInXAF / exchangeRates[toCurrency];
  }
};

export const formatCurrency = (amount: number, currency: string): string => {
  const roundedAmount = Math.round(amount * 100) / 100; // Arrondir à 2 décimales
  
  switch (currency) {
    case 'EUR':
      return `${roundedAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
    case 'CAD':
      return `${roundedAmount.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CAD$`;
    case 'XOF':
      return `${roundedAmount.toLocaleString('fr-FR')} FCFA`;
    case 'XAF':
    default:
      return `${roundedAmount.toLocaleString('fr-FR')} FCFA`;
  }
};

export const calculateFee = (
  amount: number, 
  senderCountry: string, 
  recipientCountry: string, 
  userRole: string = 'user'
) => {
  if (amount <= 0) {
    return { fee: 0, rate: 0, agentCommission: 0, moneyFlowCommission: 0 };
  }

  // Déterminer si c'est un transfert national ou international
  const isNationalTransfer = senderCountry === recipientCountry;
  
  // Pour les agents : SEULEMENT transferts internationaux autorisés
  if (userRole === 'agent' && isNationalTransfer) {
    throw new Error('Les agents ne peuvent effectuer que des transferts internationaux');
  }
  
  let baseRate: number;
  
  if (isNationalTransfer) {
    // Transferts nationaux : 1% de frais
    baseRate = 0.01;
  } else {
    // Transferts internationaux : frais progressifs
    if (amount < 350000) {
      baseRate = 0.065; // 6,5%
    } else if (amount <= 700000) {
      baseRate = 0.045; // 4,5%
    } else {
      baseRate = 0.035; // 3,5%
    }
  }
  
  const fee = amount * baseRate;
  
  // Calcul des commissions
  let agentCommission: number;
  let moneyFlowCommission: number;
  
  if (isNationalTransfer) {
    // Pour les transferts nationaux : l'agent prend 0,5% et l'entreprise 0,5%
    agentCommission = amount * 0.005;
    moneyFlowCommission = amount * 0.005;
  } else {
    // Pour les transferts internationaux : l'agent prend 1% et l'entreprise le reste
    agentCommission = amount * 0.01;
    moneyFlowCommission = fee - agentCommission;
  }
  
  return {
    fee,
    rate: baseRate * 100, // Retourner le pourcentage pour affichage
    agentCommission,
    moneyFlowCommission
  };
};
