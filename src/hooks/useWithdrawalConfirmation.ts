
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useWithdrawalConfirmation = (onClose: () => void) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [verificationCode, setVerificationCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const validateCode = () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Code invalide",
        description: "Veuillez entrer un code de vérification à 6 chiffres",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const validateUser = () => {
    if (!user?.id) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour confirmer un retrait",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  return {
    user,
    toast,
    verificationCode,
    setVerificationCode,
    isProcessing,
    setIsProcessing,
    validateCode,
    validateUser
  };
};
