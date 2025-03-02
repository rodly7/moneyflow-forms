
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RecipientInfo from "./transfer-steps/RecipientInfo";
import TransferDetails from "./transfer-steps/TransferDetails";
import TransferSummary from "./transfer-steps/TransferSummary";
import TransferStepper from "./transfer/TransferStepper";
import { useTransferForm } from "@/hooks/useTransferForm";
import { useState } from "react";
import { CheckCircle, Copy } from "lucide-react";

const TransferForm = () => {
  const {
    currentStep,
    data,
    isLoading,
    pendingTransferInfo,
    updateFields,
    back,
    handleSubmit,
    resetForm
  } = useTransferForm();

  const [copied, setCopied] = useState(false);

  const steps = [
    { title: "Informations Bénéficiaire", component: RecipientInfo },
    { title: "Détails du Transfert", component: TransferDetails },
    { title: "Résumé", component: TransferSummary },
  ];

  const CurrentStepComponent = steps[currentStep].component;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (pendingTransferInfo) {
    return (
      <div className="w-full px-2 sm:px-0">
        <Card className="backdrop-blur-md bg-white/80 shadow-xl rounded-xl border-0 overflow-hidden">
          <div className="p-4 md:p-6">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Transfert en attente</h2>
              <p className="text-gray-600 mt-2">
                Le destinataire n'a pas encore de compte. Un code a été généré pour lui permettre de réclamer le transfert.
              </p>
            </div>
            
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Email du destinataire</p>
                <p className="font-medium">{pendingTransferInfo.recipientEmail}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Code de réclamation</p>
                <div className="flex items-center justify-between bg-white border rounded-md p-3">
                  <span className="font-mono font-bold text-lg tracking-wider">
                    {pendingTransferInfo.claimCode}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => copyToClipboard(pendingTransferInfo.claimCode)}
                    className="text-emerald-600"
                  >
                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Partagez ce code avec le destinataire pour qu'il puisse réclamer l'argent.
                </p>
              </div>
            </div>
            
            <div className="flex justify-center mt-6">
              <Button 
                onClick={resetForm} 
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Faire un autre transfert
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full px-2 sm:px-0">
      <Card className="backdrop-blur-md bg-white/80 shadow-xl rounded-xl border-0 overflow-hidden">
        <div className="p-4 md:p-6">
          <div className="mb-6">
            <TransferStepper steps={steps} currentStep={currentStep} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <CurrentStepComponent {...data} updateFields={updateFields} />
            
            <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3">
              {currentStep !== 0 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={back}
                  className="w-full sm:w-auto order-2 sm:order-1"
                  disabled={isLoading}
                >
                  Retour
                </Button>
              )}
              <Button
                type="submit"
                className={`w-full sm:w-auto order-1 sm:order-2 bg-emerald-600 hover:bg-emerald-700 ${
                  currentStep === 0 ? "sm:ml-auto" : ""
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
