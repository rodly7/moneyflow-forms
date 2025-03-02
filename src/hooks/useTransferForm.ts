
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 2) {
      try {
        setIsLoading(true);
        
        const fees = data.transfer.amount * 0.08;

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

        console.log("Données du transfert:", {
          beneficiaire: data.recipient.fullName,
          identifiant: data.recipient.email,
          montant: data.transfer.amount,
          frais: fees
        });

        // Utiliser l'identifiant du destinataire (téléphone ou email)
        const recipientIdentifier = data.recipient.email;

        // Fix: Appel direct à la fonction RPC pour obtenir l'UUID du transfert
        const { data: result, error } = await supabase.rpc(
          'process_money_transfer',
          {
            sender_id: user?.id,
            recipient_identifier: recipientIdentifier,
            transfer_amount: data.transfer.amount,
            transfer_fees: fees
          }
        );

        if (error) {
          console.error('Erreur lors du transfert:', error);
          if (error.message.includes('Insufficient funds')) {
            toast({
              title: "Solde insuffisant",
              description: "Vous n'avez pas assez de fonds pour effectuer ce transfert.",
              variant: "destructive"
            });
          } else if (error.message.includes('Recipient not found')) {
            toast({
              title: "Destinataire introuvable",
              description: "L'identifiant du destinataire n'a pas été trouvé dans notre système.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Erreur",
              description: "Une erreur est survenue lors du transfert: " + error.message,
              variant: "destructive"
            });
          }
          setIsLoading(false);
          return;
        }

        // Le résultat est directement l'UUID du transfert
        const transferId = result;
        console.log('ID du transfert:', transferId);
        
        // Vérifier si c'est un transfert en attente (le destinataire n'existe pas encore)
        const { data: pendingTransfer, error: pendingError } = await supabase
          .from('pending_transfers')
          .select('id, claim_code, recipient_email, recipient_phone')
          .eq('id', transferId)
          .maybeSingle();

        if (pendingError) {
          console.error('Erreur lors de la vérification du transfert en attente:', pendingError);
        }

        if (pendingTransfer) {
          // C'est un transfert en attente vers un destinataire non existant
          const recipientContact = pendingTransfer.recipient_phone || pendingTransfer.recipient_email;
          
          setPendingTransferInfo({
            id: pendingTransfer.id,
            claimCode: pendingTransfer.claim_code,
            recipientEmail: recipientContact
          });
          
          toast({
            title: "Transfert en attente",
            description: `Un code de réclamation a été généré pour ${recipientContact}`,
          });
        } else {
          // Transfert normal vers un destinataire existant
          toast({
            title: "Transfert Réussi",
            description: `Votre transfert de ${data.transfer.amount} XAF vers ${data.recipient.fullName} a été effectué avec succès.`,
          });
          navigate('/');
        }
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
  };

  return {
    currentStep,
    data,
    isLoading,
    pendingTransferInfo,
    updateFields,
    back,
    handleSubmit,
    resetForm
  };
};
