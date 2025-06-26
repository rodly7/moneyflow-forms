
import { useState } from "react";
import { useToast } from "./use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useAgentWithdrawalRequest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const createWithdrawalRequest = async (amount: number, recipientId: string) => {
    if (!user?.id) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour effectuer cette opération",
        variant: "destructive"
      });
      return { success: false };
    }

    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: recipientId,
          amount: amount,
          status: 'pending',
          requested_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error("Erreur lors de la création de la demande:", error);
        toast({
          title: "Erreur",
          description: "Impossible de créer la demande de retrait",
          variant: "destructive"
        });
        return { success: false };
      }

      toast({
        title: "Demande créée",
        description: "La demande de retrait a été envoyée au client",
      });

      return { success: true, data };
    } catch (error) {
      console.error("Erreur lors de la création de la demande:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createWithdrawalRequest,
    isLoading
  };
};
