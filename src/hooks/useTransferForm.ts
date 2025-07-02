import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { calculateFee } from "@/integrations/supabase/client";
import { useReceiptGeneration } from "./useReceiptGeneration";

type PendingTransferInfo = {
  recipientPhone: string;
  claimCode: string;
};

interface FormData {
  recipient: {
    fullName: string;
    phone: string;
    country: string;
  };
  transfer: {
    amount: number;
    currency: string;
  };
}

interface TransferStep {
  title: string;
}

const FORM_STEPS: TransferStep[] = [
  { title: "Informations Bénéficiaire" },
  { title: "Détails du Transfert" },
  { title: "Résumé" },
];

export function useTransferForm() {
  const { user, profile, userRole } = useAuth();
  const { toast } = useToast();
  const { generateAndSaveReceipt } = useReceiptGeneration();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingTransferInfo, setPendingTransferInfo] = useState<PendingTransferInfo | null>(null);
  const [showTransferConfirmation, setShowTransferConfirmation] = useState(false);

  const [data, setData] = useState<FormData>({
    recipient: {
      fullName: "",
      phone: "",
      country: "",
    },
    transfer: {
      amount: 0,
      currency: "XAF",
    },
  });

  function updateFields(fields: Partial<FormData>) {
    setData(prev => ({ ...prev, ...fields }));
  }

  function back() {
    setCurrentStep(i => (i <= 0 ? i : i - 1));
  }

  function next() {
    setCurrentStep(i => (i >= FORM_STEPS.length - 1 ? i : i + 1));
  }

  const resetForm = () => {
    setData({
      recipient: { fullName: "", phone: "", country: "" },
      transfer: { amount: 0, currency: "XAF" },
    });
    setCurrentStep(0);
    setPendingTransferInfo(null);
    setShowTransferConfirmation(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentStep < FORM_STEPS.length - 1) {
      return next();
    }
    
    // Dernière étape - demander confirmation
    setShowTransferConfirmation(true);
  };

  const handleConfirmedTransfer = async () => {
    if (!user || !profile) {
      toast({
        title: "Erreur",
        description: "Utilisateur non connecté",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setShowTransferConfirmation(false);

    try {
      const senderCountry = profile.country || "Cameroun";
      const { fee } = calculateFee(
        data.transfer.amount,
        senderCountry,
        data.recipient.country,
        userRole || 'user'
      );

      console.log('Tentative de transfert avec les données:', {
        sender_id: user.id,
        recipient_identifier: data.recipient.phone,
        transfer_amount: data.transfer.amount,
        transfer_fees: fee
      });

      const { data: result, error } = await supabase.rpc('process_money_transfer', {
        sender_id: user.id,
        recipient_identifier: data.recipient.phone,
        transfer_amount: data.transfer.amount,
        transfer_fees: fee
      });

      if (error) {
        console.error('Erreur RPC:', error);
        throw error;
      }

      console.log('Résultat du transfert:', result);

      // Vérifier si c'est un transfert en attente (UUID de pending_transfers)
      const { data: pendingTransfer, error: pendingError } = await supabase
        .from('pending_transfers')
        .select('claim_code, recipient_phone')
        .eq('id', result)
        .single();

      if (!pendingError && pendingTransfer) {
        // C'est un transfert en attente
        setPendingTransferInfo({
          recipientPhone: pendingTransfer.recipient_phone,
          claimCode: pendingTransfer.claim_code
        });
        
        toast({
          title: "Transfert en attente",
          description: "Le destinataire recevra un code pour réclamer l'argent",
        });
        
        // Générer le reçu pour transfert en attente
        await generateAndSaveReceipt({
          id: result,
          type: 'transfer',
          amount: data.transfer.amount,
          recipient_name: data.recipient.fullName,
          recipient_phone: data.recipient.phone,
          fees: fee,
          status: 'pending'
        });
      } else {
        // Transfert direct réussi
        toast({
          title: "Transfert réussi",
          description: `${data.transfer.amount.toLocaleString('fr-FR')} FCFA envoyé à ${data.recipient.fullName}`,
        });
        
        // Générer le reçu pour transfert direct
        await generateAndSaveReceipt({
          id: result,
          type: 'transfer',
          amount: data.transfer.amount,
          recipient_name: data.recipient.fullName,
          recipient_phone: data.recipient.phone,
          fees: fee,
          status: 'completed'
        });

        resetForm();
      }

    } catch (error: any) {
      console.error('Erreur complète:', error);
      
      let errorMessage = "Une erreur est survenue lors du transfert";
      
      if (error.message?.includes('Insufficient funds')) {
        errorMessage = "Solde insuffisant pour effectuer ce transfert";
      } else if (error.message?.includes('User not found')) {
        errorMessage = "Utilisateur non trouvé";
      } else if (error.details) {
        errorMessage = `Erreur: ${error.details}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Erreur de transfert",
        description: errorMessage,
        variant: "destructive"
      });
    }

    setIsLoading(false);
  };

  return {
    currentStep,
    data,
    isLoading,
    pendingTransferInfo,
    showTransferConfirmation,
    updateFields,
    back,
    handleSubmit,
    handleConfirmedTransfer,
    resetForm,
    setShowTransferConfirmation
  };
}
