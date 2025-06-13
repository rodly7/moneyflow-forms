
import { supabase } from "@/integrations/supabase/client";

export const updateUserBalance = async (phone: string, amount: number) => {
  try {
    console.log("🔍 Recherche du profil pour le téléphone:", phone);
    
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
    
    console.log("✅ Profil trouvé:", profile.full_name, "- Solde actuel:", profile.balance);
    
    // Utiliser la fonction RPC pour créditer le compte
    const { data: newBalance, error: creditError } = await supabase.rpc('increment_balance', {
      user_id: profile.id,
      amount: amount
    });
    
    if (creditError) {
      console.error("❌ Erreur lors du crédit:", creditError);
      throw new Error("Erreur lors de la mise à jour du solde: " + creditError.message);
    }
    
    console.log("✅ Solde mis à jour avec succès. Nouveau solde:", newBalance);
    
    return {
      success: true,
      user: profile,
      oldBalance: Number(profile.balance),
      newBalance: Number(newBalance),
      amount: amount
    };
    
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du solde:", error);
    throw error;
  }
};
