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
import { countries } from "@/data/countries";

export type TransferData = {
  sender: {
    fullName: string;
    phone: string;
    country: string;
    city: string;
  };
  recipient: {
    fullName: string;
    phone: string;
    country: string;
    city: string;
  };
  transfer: {
    amount: number;
    currency: string;
  };
};

const INITIAL_DATA: TransferData = {
  sender: {
    fullName: "",
    phone: "",
    country: "",
    city: "",
  },
  recipient: {
    fullName: "",
    phone: "",
    country: "",
    city: "",
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
        const totalAmount = data.transfer.amount + fees;

        // Format phone number with country code if not already present
        let formattedPhone = data.recipient.phone;
        if (!formattedPhone.startsWith('+')) {
          // Remove any leading zeros from the phone number
          const cleanPhone = formattedPhone.replace(/^0+/, '');
          const countryCode = countries.find(c => c.name === data.recipient.country)?.code || '';
          formattedPhone = `${countryCode}${cleanPhone}`;
        }

        console.log('Searching for recipient with phone:', formattedPhone);

        // Vérifier si l'utilisateur a suffisamment de solde
        const { data: senderProfile, error: senderError } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', user?.id)
          .single();

        if (senderError) throw senderError;

        if (senderProfile.balance < totalAmount) {
          toast({
            title: "Solde insuffisant",
            description: "Vous n'avez pas assez de fonds pour effectuer ce transfert.",
            variant: "destructive"
          });
          return;
        }

        // Vérifier si le destinataire existe
        const { data: recipientProfile, error: recipientError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('phone', formattedPhone)
          .maybeSingle();

        if (recipientError) {
          console.error('Error searching for recipient:', recipientError);
          toast({
            title: "Erreur",
            description: "Une erreur est survenue lors de la vérification du destinataire.",
            variant: "destructive"
          });
          return;
        }

        if (!recipientProfile) {
          console.log('No recipient found with phone:', formattedPhone);
          toast({
            title: "Destinataire introuvable",
            description: "Le numéro de téléphone indiqué n'est pas enregistré.",
            variant: "destructive"
          });
          return;
        }

        console.log('Recipient found:', recipientProfile);

        // Créer le transfert
        const { error: transferError } = await supabase
          .from('transfers')
          .insert({
            sender_id: user?.id,
            recipient_full_name: recipientProfile.full_name,
            recipient_phone: formattedPhone,
            recipient_country: data.recipient.country,
            amount: data.transfer.amount,
            fees: fees,
            currency: data.transfer.currency,
            status: 'completed'
          });

        if (transferError) throw transferError;

        // Débiter le compte de l'expéditeur
        const { error: senderBalanceError } = await supabase.rpc('increment_balance', {
          user_id: user?.id,
          amount: -totalAmount
        });

        if (senderBalanceError) throw senderBalanceError;

        // Créditer le compte du destinataire
        const { error: recipientBalanceError } = await supabase.rpc('increment_balance', {
          user_id: recipientProfile.id,
          amount: data.transfer.amount
        });

        if (recipientBalanceError) throw recipientBalanceError;

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