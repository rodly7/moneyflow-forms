
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { secureCreditUserBalance, checkTransactionLimit } from "@/services/secureBalanceService";

export const useSecureAdminOperations = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const secureUpdateUserBalance = async (phone: string, amount: number) => {
    setIsProcessing(true);
    
    try {
      console.log("🔍 Recherche sécurisée du profil pour le téléphone:", phone);
      
      // Rechercher l'utilisateur par téléphone
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, balance')
        .eq('phone', phone)
        .maybeSingle();
      
      if (profileError) {
        console.error("❌ Erreur lors de la recherche du profil:", profileError);
        throw new Error("Erreur lors de la recherche du profil");
      }
      
      if (!profile) {
        console.error("❌ Aucun profil trouvé avec ce numéro:", phone);
        throw new Error("Aucun utilisateur trouvé avec ce numéro de téléphone");
      }

      // Vérifier les limites de transaction pour les crédits importants
      if (amount > 500000) {
        const isWithinLimits = await checkTransactionLimit(profile.id, amount, 'admin_credit');
        if (!isWithinLimits) {
          console.warn("⚠️ Montant important détecté, vérification manuelle requise");
        }
      }
      
      console.log("✅ Profil trouvé:", profile.full_name, "- Solde actuel:", profile.balance);
      
      // Utiliser la fonction sécurisée pour créditer le compte
      const newBalance = await secureCreditUserBalance(
        profile.id, 
        amount, 
        'admin_credit'
      );
      
      console.log("✅ Solde mis à jour avec succès via fonction sécurisée. Nouveau solde:", newBalance);
      
      toast({
        title: "Crédit effectué avec succès",
        description: `Compte de ${profile.full_name} crédité de ${amount} FCFA de manière sécurisée.`,
      });
      
      return {
        success: true,
        user: profile,
        oldBalance: Number(profile.balance),
        newBalance: newBalance,
        amount: amount
      };
      
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour sécurisée du solde:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors du crédit",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const checkUserRole = async (userId: string) => {
    try {
      const { data: isAdmin, error } = await supabase.rpc('is_admin', {
        user_id_param: userId
      });

      if (error) {
        console.error("Erreur lors de la vérification du rôle admin:", error);
        return false;
      }

      return Boolean(isAdmin);
    } catch (error) {
      console.error("Erreur lors de la vérification du rôle:", error);
      return false;
    }
  };

  return {
    secureUpdateUserBalance,
    checkUserRole,
    isProcessing
  };
};
