
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "./use-toast";
import { supabase, calculateFee } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useTransferOperations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const processTransfer = async (transferData: {
    amount: number;
    recipient: {
      email: string;
      fullName: string;
      country: string;
    };
  }) => {
    if (!user?.id) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour effectuer un transfert",
        variant: "destructive"
      });
      return { success: false };
    }

    try {
      setIsLoading(true);

      // Vérifier que nous avons bien les données du bénéficiaire
      if (!transferData.recipient.email || !transferData.recipient.fullName) {
        toast({
          title: "Informations incomplètes",
          description: "Veuillez fournir toutes les informations du bénéficiaire",
          variant: "destructive"
        });
        return { success: false };
      }

      // Récupérer le pays de l'utilisateur depuis son profil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('balance, country')
        .eq('id', user.id)
        .single();

      if (profileError || !profileData) {
        toast({
          title: "Erreur",
          description: "Impossible de vérifier votre solde ou pays",
          variant: "destructive"
        });
        return { success: false };
      }

      // Utiliser le pays de l'utilisateur pour calculer les frais
      const userCountry = profileData.country || "Cameroun";
      const { fee: fees, rate, agentCommission, moneyFlowCommission } = calculateFee(
        transferData.amount, 
        userCountry, 
        transferData.recipient.country,
        "user"
      );
      
      const totalAmount = transferData.amount + fees;
      
      if (profileData.balance < totalAmount) {
        toast({
          title: "Solde insuffisant",
          description: "Vous n'avez pas assez de fonds pour effectuer ce transfert",
          variant: "destructive"
        });
        return { success: false };
      }

      console.log("Données du transfert:", {
        beneficiaire: transferData.recipient.fullName,
        identifiant: transferData.recipient.email,
        montant: transferData.amount,
        frais: fees,
        tauxCommission: rate + "%",
        commissionAgent: agentCommission,
        commissionMoneyFlow: moneyFlowCommission,
        userCountry: userCountry,
        recipientCountry: transferData.recipient.country
      });

      // Utiliser l'identifiant du destinataire (téléphone ou email)
      const recipientIdentifier = transferData.recipient.email;
      
      // Utiliser la procédure stockée pour traiter le transfert d'argent
      const { data: result, error: transferProcessError } = await supabase
        .rpc('process_money_transfer', {
          sender_id: user.id,
          recipient_identifier: recipientIdentifier,
          transfer_amount: transferData.amount,
          transfer_fees: fees
        });

      if (transferProcessError) {
        console.error("Erreur lors du transfert:", transferProcessError);
        
        // Si le destinataire n'existe pas, créer un transfert en attente
        if (transferProcessError.message.includes('Recipient not found')) {
          const claimCode = Math.random().toString(36).substring(2, 8).toUpperCase();
          
          // Créer le transfert en attente
          const { error: pendingError } = await supabase
            .from('pending_transfers')
            .insert({
              sender_id: user.id,
              recipient_email: transferData.recipient.email,
              recipient_phone: transferData.recipient.phone || '',
              amount: transferData.amount,
              fees: fees,
              claim_code: claimCode,
              currency: 'XAF'
            });

          if (pendingError) {
            throw pendingError;
          }

          // Déduire le montant du solde de l'expéditeur
          const { error: balanceError } = await supabase
            .rpc('decrement_balance', {
              user_id: user.id,
              amount: totalAmount
            });

          if (balanceError) {
            throw balanceError;
          }

          return { 
            success: true, 
            claimCode: claimCode,
            isPending: true 
          };
        }
        
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors du transfert: " + transferProcessError.message,
          variant: "destructive"
        });
        return { success: false };
      }

      // Enregistrer les informations de commission en console uniquement
      console.log("Commissions pour le transfert", {
        transferId: result,
        agentCommission: agentCommission,
        moneyFlowCommission: moneyFlowCommission,
        totalFee: fees
      });

      const isNational = userCountry === transferData.recipient.country;
      const rateText = isNational ? "2,5%" : "6,5%";

      toast({
        title: "Transfert Réussi",
        description: `Votre transfert de ${transferData.amount} XAF vers ${transferData.recipient.fullName} a été effectué avec succès. Frais: ${rateText}`,
      });
      
      // Naviguer vers la page d'accueil après un transfert réussi
      navigate('/');
      return { success: true };
    } catch (error) {
      console.error('Erreur lors du transfert:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du transfert.",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    processTransfer,
    isLoading
  };
};
