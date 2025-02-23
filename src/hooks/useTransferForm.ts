
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

        const { error } = await supabase
          .rpc('process_money_transfer', {
            sender_id: user?.id,
            recipient_email: data.recipient.email,
            transfer_amount: data.transfer.amount,
            transfer_fees: fees
          });

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
              description: "Le numéro de téléphone indiqué n'est pas enregistré.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Erreur",
              description: "Une erreur est survenue lors du transfert.",
              variant: "destructive"
            });
          }
          return;
        }

        toast({
          title: "Transfert Réussi",
          description: "Votre transfert a été effectué avec succès.",
        });

        navigate('/');
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

  return {
    currentStep,
    data,
    isLoading,
    updateFields,
    back,
    handleSubmit
  };
};

