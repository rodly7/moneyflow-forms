
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "./use-toast";
import { supabase } from "@/integrations/supabase/client";
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
      return false;
    }

    try {
      setIsLoading(true);
      
      // Call the function to process the withdrawal verification
      const withdrawalResult = await supabase.rpc('process_withdrawal_verification', {
        verification_code_param: verificationCode,
        processor_id: user.id
      });

      if (withdrawalResult.error) {
        throw new Error(withdrawalResult.error.message);
      }

      toast({
        title: "Retrait confirmé",
        description: "Le retrait a été confirmé avec succès et votre compte a été crédité."
      });

      // Navigate back to home after successful confirmation
      navigate('/');
      return true;
    } catch (error) {
      console.error("Erreur lors de la confirmation du retrait:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur s'est produite lors de la confirmation du retrait",
        variant: "destructive"
      });
      return false;
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

        // Apply different fee rates based on whether the transfer is national or international
        const userCountry = profileData.country || "Cameroun";
        const isInternational = data.recipient.country && data.recipient.country !== userCountry;
        const feeRate = isInternational ? 0.09 : 0.025; // 9% for international, 2.5% for national
        const fees = data.transfer.amount * feeRate;
        
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
          isInternational: isInternational,
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
            transfer_fees: fees
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

        toast({
          title: "Transfert Réussi",
          description: `Votre transfert de ${data.transfer.amount} XAF vers ${data.recipient.fullName} a été effectué avec succès.`,
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
