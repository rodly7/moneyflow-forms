
import { supabase } from "@/integrations/supabase/client";

export const useBalanceOperations = () => {
  // Fonction pour récupérer le solde réel via RPC et créer/mettre à jour le profil
  const getOrCreateUserProfile = async (userId: string, userData: any) => {
    try {
      console.log("🔍 Récupération/création du profil pour:", userId);
      
      // D'abord, récupérer le solde réel via RPC
      const { data: realBalance, error: rpcError } = await supabase.rpc('increment_balance', {
        user_id: userId,
        amount: 0
      });
      
      if (rpcError) {
        console.error("❌ Erreur RPC:", rpcError);
      }
      
      const actualBalance = Number(realBalance) || 0;
      console.log("💰 Solde réel récupéré via RPC:", actualBalance);
      
      // Vérifier si le profil existe
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, balance, full_name, phone')
        .eq('id', userId)
        .maybeSingle();
      
      if (!profileError && existingProfile) {
        console.log("✅ Profil existant trouvé, solde:", existingProfile.balance);
        // Mettre à jour le profil avec le solde réel si nécessaire
        if (Number(existingProfile.balance) !== actualBalance) {
          console.log("🔄 Mise à jour du solde dans le profil");
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ balance: actualBalance })
            .eq('id', userId);
          
          if (updateError) {
            console.error("❌ Erreur lors de la mise à jour:", updateError);
          } else {
            console.log("✅ Solde mis à jour avec succès");
          }
        }
        
        return {
          userId: userId,
          balance: actualBalance,
          fullName: existingProfile.full_name || userData.full_name || 'Utilisateur',
          foundPhone: existingProfile.phone || userData.phone || ''
        };
      } else {
        console.log("🔧 Création du profil manquant avec le solde réel:", actualBalance);
        
        // Créer le profil avec le solde réel
        const { data: insertedProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            phone: userData.phone || '',
            full_name: userData.full_name || 'Utilisateur',
            country: userData.country || 'Congo Brazzaville',
            address: userData.address || '',
            balance: actualBalance
          })
          .select()
          .single();

        if (insertError) {
          console.error("❌ Erreur lors de la création du profil:", insertError);
          // Si l'insertion échoue, essayer de mettre à jour le solde via RPC pour s'assurer qu'il existe
          const { error: rpcUpdateError } = await supabase.rpc('increment_balance', {
            user_id: userId,
            amount: 0
          });
          
          if (!rpcUpdateError) {
            console.log("✅ Solde créé via RPC, tentative de récupération du profil");
            // Réessayer de récupérer le profil
            const { data: retryProfile } = await supabase
              .from('profiles')
              .select('id, balance, full_name, phone')
              .eq('id', userId)
              .maybeSingle();
            
            if (retryProfile) {
              return {
                userId: userId,
                balance: Number(retryProfile.balance) || 0,
                fullName: retryProfile.full_name || userData.full_name || 'Utilisateur',
                foundPhone: retryProfile.phone || userData.phone || ''
              };
            }
          }
        } else {
          console.log("✅ Profil créé avec succès:", insertedProfile);
        }
        
        return {
          userId: userId,
          balance: actualBalance,
          fullName: userData.full_name || 'Utilisateur',
          foundPhone: userData.phone || ''
        };
      }
    } catch (error) {
      console.error("❌ Erreur lors de la récupération/création du profil:", error);
      return {
        userId: userId,
        balance: 0,
        fullName: userData.full_name || 'Utilisateur',
        foundPhone: userData.phone || ''
      };
    }
  };

  return {
    getOrCreateUserProfile
  };
};
