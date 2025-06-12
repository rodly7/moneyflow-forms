
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = "https://msasycggbiwyxlczknwj.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zYXN5Y2dnYml3eXhsY3prbndqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczNjU5MTMsImV4cCI6MjA1Mjk0MTkxM30.Ezb5GjSg8ApUWR5iNMvVS9bSA7oxudUuYOP2g2ugB_4"

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Currency utilities
export const getCurrencyForCountry = (country: string): string => {
  const currencyMap: { [key: string]: string } = {
    'Cameroun': 'XAF',
    'Senegal': 'XOF',
    'Côte d\'Ivoire': 'XOF',
    'Congo Brazzaville': 'XAF',
    'Gabon': 'XAF',
    'Mali': 'XOF',
    'Burkina Faso': 'XOF',
    'Niger': 'XOF',
    'Tchad': 'XAF',
    'République Centrafricaine': 'XAF',
    'Guinée Équatoriale': 'XAF',
    'Bénin': 'XOF',
    'Togo': 'XOF'
  };
  
  return currencyMap[country] || 'XAF';
};

export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  // For now, XAF and XOF have the same value (both are CFA francs)
  // In a real application, you would use actual exchange rates
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  // XAF and XOF are both CFA francs with same value
  if ((fromCurrency === 'XAF' && toCurrency === 'XOF') || 
      (fromCurrency === 'XOF' && toCurrency === 'XAF')) {
    return amount;
  }
  
  return amount;
};

export const formatCurrency = (amount: number, currency: string): string => {
  return `${amount.toLocaleString('fr-FR')} ${currency}`;
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
  
  // Nouveaux taux: 2.5% national, 6.5% international
  const baseRate = isNationalTransfer ? 0.025 : 0.065;
  
  const fee = amount * baseRate;
  
  // Calcul des commissions (exemple: 30% pour l'agent, 70% pour la plateforme)
  const agentCommission = fee * 0.3;
  const moneyFlowCommission = fee * 0.7;
  
  return {
    fee,
    rate: baseRate * 100, // Retourner le pourcentage pour affichage
    agentCommission,
    moneyFlowCommission
  };
};
