
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserSearchResult {
  id: string;
  full_name: string;
  phone: string;
  balance: number;
  country?: string;
}

export const useUserSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const searchUserByPhone = async (phoneNumber: string): Promise<UserSearchResult | null> => {
    if (!phoneNumber || phoneNumber.length < 6) {
      return null;
    }

    setIsSearching(true);
    try {
      console.log("🔍 Recherche d'utilisateur avec find_recipient:", phoneNumber);
      
      // Utiliser la même fonction RPC que dans les transferts
      const { data, error } = await supabase.rpc('find_recipient', { 
        search_term: phoneNumber 
      });

      if (error) {
        console.error("❌ Erreur lors de la recherche:", error);
        return null;
      }

      if (data && data.length > 0) {
        const userData = data[0];
        console.log("✅ Utilisateur trouvé via find_recipient:", userData);
        
        // Récupérer le solde exact via RPC
        const { data: currentBalance, error: balanceError } = await supabase.rpc('increment_balance', {
          user_id: userData.id,
          amount: 0
        });
        
        const actualBalance = balanceError ? 0 : Number(currentBalance) || 0;
        
        return {
          id: userData.id,
          full_name: userData.full_name || "Utilisateur",
          phone: userData.phone,
          balance: actualBalance,
          country: userData.country
        };
      }

      console.log("ℹ️ Aucun utilisateur trouvé avec find_recipient");
      return null;
      
    } catch (error) {
      console.error("❌ Erreur lors de la recherche d'utilisateur:", error);
      return null;
    } finally {
      setIsSearching(false);
    }
  };

  return {
    searchUserByPhone,
    isSearching
  };
};
