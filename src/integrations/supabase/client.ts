
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://msasycggbiwyxlczknwj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zYXN5Y2dnYml3eXhsY3prbndqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczNjU5MTMsImV4cCI6MjA1Mjk0MTkxM30.Ezb5GjSg8ApUWR5iNMvVS9bSA7oxudUuYOP2g2ugB_4";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: localStorage,
      storageKey: 'supabase.auth.token',
    }
  }
);

// Function to generate a random 6-digit verification code
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Currency conversion rates (simplified for demo)
export const currencyRates = {
  "XAF": 1,       // Base currency (Central African CFA franc)
  "USD": 0.0016,  // 1 XAF = 0.0016 USD
  "EUR": 0.0015,  // 1 XAF = 0.0015 EUR
  "NGN": 2.48,    // 1 XAF = 2.48 Nigerian Naira
  "GHS": 0.026,   // 1 XAF = 0.026 Ghanaian Cedi
  "KES": 0.21,    // 1 XAF = 0.21 Kenyan Shilling
};

// Function to convert amounts between currencies
export const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  if (fromCurrency === toCurrency) return amount;
  
  const fromRate = currencyRates[fromCurrency as keyof typeof currencyRates] || 1;
  const toRate = currencyRates[toCurrency as keyof typeof currencyRates] || 1;
  
  // Convert to XAF first (base currency), then to target currency
  const amountInXAF = fromCurrency === "XAF" ? amount : amount / fromRate;
  return toCurrency === "XAF" ? amountInXAF : amountInXAF * toRate;
};

// Get currency for a country
export const getCurrencyForCountry = (country: string): string => {
  const countryToCurrency: Record<string, string> = {
    "Cameroun": "XAF",
    "Cameroon": "XAF",
    "Congo Brazzaville": "XAF",
    "Gabon": "XAF",
    "Tchad": "XAF",
    "Chad": "XAF",
    "République Centrafricaine": "XAF",
    "Central African Republic": "XAF",
    "Guinée Équatoriale": "XAF",
    "Equatorial Guinea": "XAF",
    "Nigeria": "NGN",
    "Ghana": "GHS",
    "Kenya": "KES",
    "USA": "USD",
    "United States": "USD",
    "France": "EUR",
    // Default to XAF for other countries
  };
  
  return countryToCurrency[country] || "XAF";
};

// Format currency with appropriate symbol
export const formatCurrency = (amount: number, currencyCode: string): string => {
  const currencySymbols: Record<string, string> = {
    "XAF": "FCFA",
    "USD": "$",
    "EUR": "€",
    "NGN": "₦",
    "GHS": "₵",
    "KES": "KSh",
  };

  const symbol = currencySymbols[currencyCode] || currencyCode;
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currencyCode,
    currencyDisplay: 'symbol',
    maximumFractionDigits: 0,
  }).format(amount).replace(currencyCode, symbol);
};

// Function to handle withdrawal operations - now with verification code
export const processWithdrawal = async (userId: string, amount: number, phoneNumber: string) => {
  try {
    // Check user balance
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile) {
      throw new Error("Impossible de vérifier votre solde");
    }
    
    if (profile.balance < amount) {
      throw new Error("Solde insuffisant pour effectuer ce retrait");
    }
    
    // Generate a verification code
    const verificationCode = generateVerificationCode();
    
    // Create withdrawal record with verification code
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawals')
      .insert({
        user_id: userId,
        amount: amount,
        withdrawal_phone: phoneNumber,
        status: 'pending',
        verification_code: verificationCode
      })
      .select()
      .single();
    
    if (withdrawalError) {
      throw withdrawalError;
    }
    
    // Update user balance
    const { error: balanceError } = await supabase
      .from('profiles')
      .update({ balance: profile.balance - amount })
      .eq('id', userId);
      
    if (balanceError) {
      throw new Error("Erreur lors de la mise à jour du solde");
    }
    
    return {
      ...withdrawal,
      verificationCode // This will be displayed to the user requesting the withdrawal
    };
  } catch (error) {
    throw error;
  }
};

// Function to process withdrawal verification using a code instead of QR
export const processWithdrawalVerification = async (verificationCode: string, processorId: string) => {
  try {
    // Fetch the withdrawal details with the verification code
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('verification_code', verificationCode)
      .eq('status', 'pending')
      .single();
    
    if (fetchError || !withdrawal) {
      throw new Error("Ce code de vérification n'existe pas ou a déjà été utilisé");
    }
    
    // Ensure the processor is different from the requester
    if (withdrawal.user_id === processorId) {
      throw new Error("Vous ne pouvez pas confirmer votre propre retrait");
    }
    
    // Update withdrawal status to 'completed'
    const { error: updateError } = await supabase
      .from('withdrawals')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', withdrawal.id);
    
    if (updateError) throw updateError;
    
    // Add funds to the processor's account
    const { error: balanceError } = await supabase
      .rpc('increment_balance', { 
        user_id: processorId, 
        amount: withdrawal.amount 
      });
    
    if (balanceError) {
      throw new Error("Erreur lors du transfert des fonds");
    }
    
    return withdrawal;
  } catch (error) {
    throw error;
  }
};
