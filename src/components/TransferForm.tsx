
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RecipientInfo from "./transfer-steps/RecipientInfo";
import TransferDetails from "./transfer-steps/TransferDetails";
import TransferSummary from "./transfer-steps/TransferSummary";
import TransferStepper from "./transfer/TransferStepper";
import { useTransferForm } from "@/hooks/useTransferForm";

const TransferForm = () => {
  const {
    currentStep,
    data,
    isLoading,
    updateFields,
    back,
    handleSubmit
  } = useTransferForm();

  const steps = [
    { title: "Informations Bénéficiaire", component: RecipientInfo },
    { title: "Détails du Transfert", component: TransferDetails },
    { title: "Résumé", component: TransferSummary },
  ];

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="w-full">
      <Card className="backdrop-blur-md bg-white/80 shadow-xl rounded-xl border-0 overflow-hidden">
        <div className="p-4 md:p-6">
          <div className="mb-6">
            <TransferStepper steps={steps} currentStep={currentStep} />
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

