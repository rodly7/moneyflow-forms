
import { supabase } from "@/integrations/supabase/client";

export const getUserTransactionHistory = async (userId: string) => {
  console.log("=== DIAGNOSTIC POUR L'UTILISATEUR ===", userId);
  
  try {
    // 1. Récupérer le profil utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error("Erreur lors de la récupération du profil:", profileError);
      return null;
    }

    console.log("📄 PROFIL UTILISATEUR:", {
      nom: profile.full_name,
      telephone: profile.phone,
      solde_actuel: profile.balance,
      date_creation: profile.created_at
    });

    // 2. Récupérer les transferts reçus
    const { data: transfersReceived, error: transfersReceivedError } = await supabase
      .from('transfers')
      .select('*')
      .eq('recipient_phone', profile.phone)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (!transfersReceivedError && transfersReceived) {
      console.log("💰 TRANSFERTS REÇUS:", transfersReceived.length);
      transfersReceived.forEach(transfer => {
        console.log(`  - ${transfer.amount} FCFA de ${transfer.sender_id} le ${transfer.created_at}`);
      });
    }

    // 3. Récupérer les transferts envoyés
    const { data: transfersSent, error: transfersSentError } = await supabase
      .from('transfers')
      .select('*')
      .eq('sender_id', userId)
      .order('created_at', { ascending: false });

    if (!transfersSentError && transfersSent) {
      console.log("📤 TRANSFERTS ENVOYÉS:", transfersSent.length);
      transfersSent.forEach(transfer => {
        console.log(`  - ${transfer.amount} FCFA vers ${transfer.recipient_full_name} le ${transfer.created_at}`);
      });
    }

    // 4. Récupérer les retraits
    const { data: withdrawals, error: withdrawalsError } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!withdrawalsError && withdrawals) {
      console.log("🏧 RETRAITS:", withdrawals.length);
      withdrawals.forEach(withdrawal => {
        console.log(`  - ${withdrawal.amount} FCFA (${withdrawal.status}) le ${withdrawal.created_at}`);
      });
    }

    // 5. Récupérer les recharges
    const { data: recharges, error: rechargesError } = await supabase
      .from('recharges')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!rechargesError && recharges) {
      console.log("💳 RECHARGES:", recharges.length);
      recharges.forEach(recharge => {
        console.log(`  - ${recharge.amount} FCFA (${recharge.status}) le ${recharge.created_at}`);
      });
    }

    // 6. Calculer le solde théorique
    const totalReceived = transfersReceived?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const totalSent = transfersSent?.reduce((sum, t) => sum + Number(t.amount) + Number(t.fees), 0) || 0;
    const totalWithdrawn = withdrawals?.filter(w => w.status === 'completed').reduce((sum, w) => sum + Number(w.amount), 0) || 0;
    const totalRecharged = recharges?.filter(r => r.status === 'completed').reduce((sum, r) => sum + Number(r.amount), 0) || 0;

    const theoreticalBalance = totalReceived + totalRecharged - totalSent - totalWithdrawn;

    console.log("🔢 CALCUL DU SOLDE THÉORIQUE:");
    console.log(`  + Transferts reçus: ${totalReceived} FCFA`);
    console.log(`  + Recharges: ${totalRecharged} FCFA`);
    console.log(`  - Transferts envoyés: ${totalSent} FCFA`);
    console.log(`  - Retraits: ${totalWithdrawn} FCFA`);
    console.log(`  = Solde théorique: ${theoreticalBalance} FCFA`);
    console.log(`  📊 Solde actuel BD: ${profile.balance} FCFA`);
    console.log(`  ❗ Différence: ${Number(profile.balance) - theoreticalBalance} FCFA`);

    return {
      profile,
      transfersReceived: transfersReceived || [],
      transfersSent: transfersSent || [],
      withdrawals: withdrawals || [],
      recharges: recharges || [],
      theoreticalBalance,
      actualBalance: Number(profile.balance),
      difference: Number(profile.balance) - theoreticalBalance
    };

  } catch (error) {
    console.error("Erreur lors du diagnostic:", error);
    return null;
  }
};

export const findUserByPhone = async (phoneNumber: string) => {
  console.log("🔍 RECHERCHE UTILISATEUR PAR TÉLÉPHONE:", phoneNumber);
  
  try {
    // Recherche flexible par téléphone
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      console.error("Erreur lors de la recherche:", error);
      return null;
    }

    // Fonction pour normaliser les numéros
    const normalizePhone = (phone: string) => {
      return phone.replace(/\D/g, ''); // Enlever tous les caractères non-numériques
    };

    const normalizedSearch = normalizePhone(phoneNumber);
    console.log("📱 Numéro normalisé recherché:", normalizedSearch);

    // Chercher une correspondance
    const matchingProfile = profiles?.find(profile => {
      if (!profile.phone) return false;
      const normalizedProfilePhone = normalizePhone(profile.phone);
      
      // Correspondance exacte
      if (normalizedProfilePhone === normalizedSearch) {
        console.log("✅ Correspondance exacte trouvée");
        return true;
      }
      
      // Correspondance par les 8 derniers chiffres
      if (normalizedProfilePhone.slice(-8) === normalizedSearch.slice(-8) && normalizedSearch.length >= 8) {
        console.log("✅ Correspondance par les 8 derniers chiffres");
        return true;
      }
      
      return false;
    });

    if (matchingProfile) {
      console.log("👤 UTILISATEUR TROUVÉ:", {
        id: matchingProfile.id,
        nom: matchingProfile.full_name,
        telephone: matchingProfile.phone,
        solde: matchingProfile.balance
      });
      
      // Lancer le diagnostic automatiquement
      await getUserTransactionHistory(matchingProfile.id);
      
      return matchingProfile;
    } else {
      console.log("❌ Aucun utilisateur trouvé");
      return null;
    }

  } catch (error) {
    console.error("Erreur lors de la recherche:", error);
    return null;
  }
};
