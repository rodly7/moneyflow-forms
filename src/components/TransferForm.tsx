import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import SenderInfo from "./transfer-steps/SenderInfo";
import RecipientInfo from "./transfer-steps/RecipientInfo";
import TransferDetails from "./transfer-steps/TransferDetails";
import TransferSummary from "./transfer-steps/TransferSummary";

export type TransferData = {
  sender: {
    fullName: string;
    address: string;
    phone: string;
    country: string;
    paymentMethod: string;
  };
  recipient: {
    fullName: string;
    address: string;
    phone: string;
    country: string;
    receiveMethod: string;
  };
  transfer: {
    amount: number;
    currency: string;
    code: string;
  };
};

const INITIAL_DATA: TransferData = {
  sender: {
    fullName: "",
    address: "",
    phone: "",
    country: "",
    paymentMethod: "",
  },
  recipient: {
    fullName: "",
    address: "",
    phone: "",
    country: "",
    receiveMethod: "",
  },
  transfer: {
    amount: 0,
    currency: "XAF",
    code: "",
  },
};

const TransferForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState(INITIAL_DATA);
  const { toast } = useToast();

  const steps = [
    { title: "Informations Expéditeur", component: SenderInfo },
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === steps.length - 1) {
      toast({
        title: "Transfert Initié",
        description: "Votre transfert a été initié avec succès.",
      });
      console.log("Transfer data:", data);
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
                >
                  Retour
                </Button>
              )}
              <Button
                type="submit"
                className={`w-full md:w-auto order-1 md:order-2 bg-emerald-600 hover:bg-emerald-700 ${
                  currentStep === 0 ? "md:ml-auto" : ""
                }`}
              >
                {currentStep === steps.length - 1 ? "Valider le Transfert" : "Continuer"}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default TransferForm;