
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "./use-toast";
import { supabase, calculateFee } from "@/integrations/supabase/client";
import { TransferData, INITIAL_TRANSFER_DATA } from "@/types/transfer";
import { useAuth } from "@/contexts/AuthContext";

export const useTransferForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState(INITIAL_TRANSFER_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingTransferInfo, setPendingTransferInfo] = useState<{
    id: string;
    claimCode: string;
    recipientEmail: string;
  } | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const updateFields = (fields: Partial<TransferData>) => {
    setData((prev) => ({ ...prev, ...fields }));
  };

  const next = () => {
    setCurrentStep((i) => {
      if (i >= 2) return i;
      return i + 1;
    });
  };

  const back = () => {
    setCurrentStep((i) => {
      if (i <= 0) return i;
      return i - 1;
    });
  };

  const confirmWithdrawal = async (verificationCode: string) => {
    if (!user?.id) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour confirmer un retrait",
        variant: "destructive"
      });
      return { success: false, message: "Erreur d'authentification" };
    }

    try {
      setIsLoading(true);
      
      // Trouver le retrait avec ce code de vérification
      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('verification_code', verificationCode)
        .eq('status', 'pending')
        .single();

      if (withdrawalError || !withdrawalData) {
        throw new Error("Ce code de vérification n'existe pas ou a déjà été utilisé");
      }

      // S'assurer que l'agent n'est pas l'utilisateur qui a fait la demande
      if (withdrawalData.user_id === user.id) {
        throw new Error("Vous ne pouvez pas confirmer votre propre retrait");
      }

      // Calculer les frais (2% pour les retraits - 0,5% pour l'agent, 1,5% pour MoneyFlow)
      const { fee, agentCommission, moneyFlowCommission } = calculateFee(withdrawalData.amount);

      // Mettre à jour le statut du retrait à 'completed'
      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({ 
          status: 'completed', 
          updated_at: new Date().toISOString(),
          fee: fee,
          agent_commission: agentCommission,
          platform_commission: moneyFlowCommission
        })
        .eq('id', withdrawalData.id);

      if (updateError) throw updateError;

      // Ajouter les fonds (montant moins les frais plus la commission de l'agent) au compte de l'agent
      const { error: balanceError } = await supabase
        .rpc('increment_balance', { 
          user_id: user.id, 
          amount: withdrawalData.amount - fee + agentCommission
        });

      if (balanceError) {
        throw new Error("Erreur lors du transfert des fonds");
      }

      // Créditer les frais au compte admin (partie MoneyFlow)
      const { data: adminData } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', '+221773637752')
        .single();

      if (adminData) {
        await supabase.rpc('increment_balance', {
          user_id: adminData.id,
          amount: moneyFlowCommission
        });
      }

      toast({
        title: "Retrait confirmé",
        description: "Le retrait a été confirmé avec succès et votre compte a été crédité."
      });

      // Retourner les informations sur le retrait et les commissions
      return {
        success: true,
        amount: withdrawalData.amount,
        agentCommission: agentCommission,
        moneyFlowCommission: moneyFlowCommission,
        totalFee: fee
      };
    } catch (error) {
      console.error("Erreur lors de la confirmation du retrait:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur s'est produite lors de la confirmation du retrait",
        variant: "destructive"
      });
      return { 
        success: false, 
        message: error instanceof Error ? error.message : "Une erreur s'est produite lors de la confirmation du retrait" 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 2) {
      try {
        setIsLoading(true);
        
        // Vérifier que nous avons bien les données du bénéficiaire
        if (!data.recipient.email || !data.recipient.fullName) {
          toast({
            title: "Informations incomplètes",
            description: "Veuillez fournir toutes les informations du bénéficiaire",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        // Vérifier que l'utilisateur est authentifié
        if (!user?.id) {
          toast({
            title: "Erreur d'authentification",
            description: "Vous devez être connecté pour effectuer un transfert",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        // Get user's country from profile
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
          setIsLoading(false);
          return;
        }

        // Appliquer les nouveaux taux de frais selon si le transfert est national ou international
        const userCountry = profileData.country || "Cameroun";
        const { fee: fees, rate, agentCommission, moneyFlowCommission } = calculateFee(
          data.transfer.amount, 
          userCountry, 
          data.recipient.country
        );
        
        const totalAmount = data.transfer.amount + fees;
        
        if (profileData.balance < totalAmount) {
          toast({
            title: "Solde insuffisant",
            description: "Vous n'avez pas assez de fonds pour effectuer ce transfert",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        console.log("Données du transfert:", {
          beneficiaire: data.recipient.fullName,
          identifiant: data.recipient.email,
          montant: data.transfer.amount,
          frais: fees,
          tauxCommission: rate * 100 + "%",
          commissionAgent: agentCommission,
          commissionMoneyFlow: moneyFlowCommission,
          userCountry: userCountry,
          recipientCountry: data.recipient.country
        });

        // Utiliser l'identifiant du destinataire (téléphone ou email)
        const recipientIdentifier = data.recipient.email;

        // Utiliser la procédure stockée pour traiter le transfert d'argent
        const { data: result, error: transferProcessError } = await supabase
          .rpc('process_money_transfer', {
            sender_id: user.id,
            recipient_identifier: recipientIdentifier,
            transfer_amount: data.transfer.amount,
            transfer_fees: fees,
            agent_commission: agentCommission,
            platform_commission: moneyFlowCommission
          });

        if (transferProcessError) {
          console.error("Erreur lors du transfert:", transferProcessError);
          toast({
            title: "Erreur",
            description: "Une erreur est survenue lors du transfert: " + transferProcessError.message,
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        // La procédure renvoie l'ID du transfert créé
        console.log("ID du transfert créé:", result);

        const isNational = userCountry === data.recipient.country;
        const rateText = isNational ? "2%" : "6%";

        toast({
          title: "Transfert Réussi",
          description: `Votre transfert de ${data.transfer.amount} XAF vers ${data.recipient.fullName} a été effectué avec succès. Frais: ${rateText}`,
        });
        
        // Réinitialiser le formulaire et naviguer vers la page d'accueil après un transfert réussi
        resetForm();
      } catch (error) {
        console.error('Erreur lors du transfert:', error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors du transfert.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      next();
    }
  };

  const resetForm = () => {
    setData(INITIAL_TRANSFER_DATA);
    setCurrentStep(0);
    setPendingTransferInfo(null);
    // Naviguer vers la page d'accueil après avoir réinitialisé le formulaire
    navigate('/');
  };

  return {
    currentStep,
    data,
    isLoading,
    pendingTransferInfo,
    updateFields,
    back,
    handleSubmit,
    resetForm,
    confirmWithdrawal
  };
};
