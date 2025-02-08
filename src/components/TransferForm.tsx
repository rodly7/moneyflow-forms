
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import RecipientInfo from "./transfer-steps/RecipientInfo";
import TransferDetails from "./transfer-steps/TransferDetails";
import TransferSummary from "./transfer-steps/TransferSummary";

export type TransferData = {
  recipient: {
    fullName: string;
    phone: string;
    country: string;
  };
  transfer: {
    amount: number;
    currency: string;
  };
};

const INITIAL_DATA: TransferData = {
  recipient: {
    fullName: "",
    phone: "",
    country: "",
  },
  transfer: {
    amount: 0,
    currency: "XAF",
  },
};

const TransferForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const steps = [
    { title: "Informations Bénéficiaire", component: RecipientInfo },
    { title: "Détails du Transfert", component: TransferDetails },
    { title: "Résumé", component: TransferSummary },
  ];

  const updateFields = (fields: Partial<TransferData>) => {
    setData((prev) => ({ ...prev, ...fields }));
  };

  const next = () => {
    setCurrentStep((i) => {
      if (i >= steps.length - 1) return i;
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
    if (currentStep === steps.length - 1) {
      try {
        setIsLoading(true);
        
        const fees = data.transfer.amount * 0.08; // 8% de frais

        // Utiliser la nouvelle fonction sécurisée pour le transfert
        const { data: result, error } = await supabase
          .rpc('process_money_transfer', {
            sender_id: user?.id,
            recipient_phone: data.recipient.phone,
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

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="w-full">
      <Card className="backdrop-blur-md bg-white/80 shadow-xl rounded-xl border-0 overflow-hidden">
        <div className="p-4 md:p-6">
          <div className="mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className={`flex items-center ${
                    index === steps.length - 1 ? "" : "flex-1"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      index <= currentStep
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div
                    className={`text-sm ml-2 transition-colors ${
                      index <= currentStep ? "text-emerald-600" : "text-gray-500"
                    }`}
                  >
                    {step.title}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`hidden md:block h-0.5 flex-1 mx-4 transition-colors ${
                        index < currentStep ? "bg-emerald-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <CurrentStepComponent {...data} updateFields={updateFields} />
            
            <div className="mt-6 flex flex-col md:flex-row justify-between gap-3">
              {currentStep !== 0 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={back}
                  className="w-full md:w-auto order-2 md:order-1"
                  disabled={isLoading}
                >
                  Retour
                </Button>
              )}
              <Button
                type="submit"
                className={`w-full md:w-auto order-1 md:order-2 bg-emerald-600 hover:bg-emerald-700 ${
                  currentStep === 0 ? "md:ml-auto" : ""
                }`}
                disabled={isLoading}
              >
                {isLoading 
                  ? "Traitement en cours..." 
                  : currentStep === steps.length - 1 
                    ? "Valider le Transfert" 
                    : "Continuer"
                }
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default TransferForm;
