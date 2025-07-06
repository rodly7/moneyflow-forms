
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RecipientInfo from "./transfer-steps/RecipientInfo";
import TransferDetails from "./transfer-steps/TransferDetails";
import TransferSummary from "./transfer-steps/TransferSummary";
import TransferStepper from "./transfer/TransferStepper";
import TransferConfirmation from "./transfer/TransferConfirmation";
import { useTransferForm } from "@/hooks/useTransferForm";
import { useState } from "react";
import { CheckCircle, Copy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const TransferForm = () => {
  const { userRole, profile } = useAuth();
  const {
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

  // Écran de confirmation pour transfert en attente
  if (pendingTransferInfo) {
    return (
      <div className="w-full">
        <Card className="backdrop-blur-md bg-white/80 shadow-xl rounded-xl border-0 overflow-hidden w-full">
        <div className="p-3 w-full">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold">Transfert en attente</h2>
              <p className="text-gray-600 mt-2">
                Le destinataire n'a pas encore de compte. Un code a été généré pour lui permettre de réclamer le transfert.
              </p>
            </div>
            
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg w-full">
              <div>
                <p className="text-sm text-gray-500">Téléphone du destinataire</p>
                <p className="font-medium">{pendingTransferInfo.recipientPhone}</p>
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
                className={`w-full ${
                  userRole === 'agent' 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                Faire un autre transfert
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Formulaire de transfert principal
  return (
    <div className="w-full">
      <Card className="backdrop-blur-md bg-white/80 shadow-xl rounded-xl border-0 overflow-hidden w-full">
        <div className="p-3 w-full">
          {/* En-tête adapté selon le rôle */}
          {userRole === 'agent' && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md w-full">
              <p className="text-blue-700 text-sm font-medium">
                💼 Mode Agent: Effectuez des transferts pour vos clients depuis {profile?.country || 'votre pays'}
              </p>
            </div>
          )}

          <div className="mb-6 w-full">
            <TransferStepper steps={steps} currentStep={currentStep} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 w-full">
            <div className="w-full">
              <CurrentStepComponent {...data} updateFields={updateFields} />
            </div>
            
            <div className="mt-4 flex flex-col sm:flex-row justify-between gap-3 w-full">
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
                className={`w-full sm:w-auto order-1 sm:order-2 ${
                  userRole === 'agent' 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-emerald-600 hover:bg-emerald-700'
                } ${currentStep === 0 ? "sm:ml-auto" : ""}`}
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

      {/* Confirmation sécurisée du transfert */}
      <TransferConfirmation
        isOpen={showTransferConfirmation}
        onClose={() => setShowTransferConfirmation(false)}
        onConfirm={handleConfirmedTransfer}
        transferData={{
          amount: data.transfer.amount,
          recipientName: data.recipient.fullName,
          recipientPhone: data.recipient.phone,
          recipientCountry: data.recipient.country,
          senderCountry: profile?.country || "Cameroun"
        }}
        isProcessing={isLoading}
      />
    </div>
  );
};

export default TransferForm;
