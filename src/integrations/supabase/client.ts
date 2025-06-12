
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = "https://msasycggbiwyxlczknwj.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zYXN5Y2dnYml3eXhsY3prbndqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczNjU5MTMsImV4cCI6MjA1Mjk0MTkxM30.Ezb5GjSg8ApUWR5iNMvVS9bSA7oxudUuYOP2g2ugB_4"

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export const calculateFee = (
  amount: number, 
  senderCountry: string, 
  recipientCountry: string, 
  userRole: string = 'user'
) => {
  if (amount <= 0) {
    return { fee: 0, rate: 0 };
  }

  // Déterminer si c'est un transfert national ou international
  const isNationalTransfer = senderCountry === recipientCountry;
  
  // Taux de base selon le type de transfert
  const baseRate = isNationalTransfer ? 0.025 : 0.065; // 2.5% national, 6.5% international
  
  const fee = amount * baseRate;
  
  return {
    fee,
    rate: baseRate * 100 // Retourner le pourcentage pour affichage
  };
};
