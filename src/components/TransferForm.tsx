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
    idType: string;
    idNumber: string;
  };
  recipient: {
    fullName: string;
    address: string;
    phone: string;
    bankName: string;
    accountNumber: string;
    swiftCode: string;
  };
  transfer: {
    amount: number;
    currency: string;
    reason: string;
  };
};

const INITIAL_DATA: TransferData = {
  sender: {
    fullName: "",
    address: "",
    phone: "",
    idType: "",
    idNumber: "",
  },
  recipient: {
    fullName: "",
    address: "",
    phone: "",
    bankName: "",
    accountNumber: "",
    swiftCode: "",
  },
  transfer: {
    amount: 0,
    currency: "EUR",
    reason: "",
  },
};

const TransferForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState(INITIAL_DATA);
  const { toast } = useToast();

  const steps = [
    { title: "Sender Information", component: SenderInfo },
    { title: "Recipient Information", component: RecipientInfo },
    { title: "Transfer Details", component: TransferDetails },
    { title: "Summary", component: TransferSummary },
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
        title: "Transfer Initiated",
        description: "Your transfer has been successfully initiated.",
      });
      // Here you would typically send the data to your backend
      console.log("Transfer data:", data);
    } else {
      next();
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <Card className="p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`flex items-center ${
                  index === steps.length - 1 ? "" : "flex-1"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    index <= currentStep
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {index + 1}
                </div>
                <div
                  className={`text-sm ml-2 ${
                    index <= currentStep ? "text-primary" : "text-gray-500"
                  }`}
                >
                  {step.title}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-4 ${
                      index < currentStep ? "bg-primary" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <CurrentStepComponent {...data} updateFields={updateFields} />
          
          <div className="mt-6 flex justify-between">
            {currentStep !== 0 && (
              <Button type="button" variant="outline" onClick={back}>
                Back
              </Button>
            )}
            <Button
              type="submit"
              className={`${currentStep === 0 ? "ml-auto" : ""}`}
            >
              {currentStep === steps.length - 1 ? "Submit Transfer" : "Continue"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default TransferForm;