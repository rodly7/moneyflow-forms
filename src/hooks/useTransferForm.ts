
import { useState } from "react";
import { TransferData, INITIAL_TRANSFER_DATA } from "@/types/transfer";
import { useTransferOperations } from "./useTransferOperations";
import { useWithdrawalRequest } from "./useWithdrawalRequest";

export const useTransferForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState(INITIAL_TRANSFER_DATA);
  const [pendingTransferInfo, setPendingTransferInfo] = useState<{
    id: string;
    claimCode: string;
    recipientEmail: string;
  } | null>(null);

  const { processTransfer, isLoading } = useTransferOperations();
  const { createWithdrawalRequest } = useWithdrawalRequest();

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

  const confirmWithdrawal = async (verificationCode: string) => {
    const result = await createWithdrawalRequest(
      data.transfer.amount,
      verificationCode
    );
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 2) {
      const result = await processTransfer({
        amount: data.transfer.amount,
        recipient: data.recipient
      });
      
      if (result.success) {
        resetForm();
      }
    } else {
      next();
    }
  };

  const resetForm = () => {
    setData(INITIAL_TRANSFER_DATA);
    setCurrentStep(0);
    setPendingTransferInfo(null);
  };

  return {
    currentStep,
    data,
    isLoading,
    pendingTransferInfo,
    updateFields,
    back,
    handleSubmit,
    resetForm,
    confirmWithdrawal
  };
};
