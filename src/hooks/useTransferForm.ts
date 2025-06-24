
import { useState, useCallback } from "react";
import { TransferData, INITIAL_TRANSFER_DATA } from "@/types/transfer";
import { useTransferOperations } from "./useTransferOperations";
import { useWithdrawalRequest } from "./useWithdrawalRequest";

export const useTransferForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState(INITIAL_TRANSFER_DATA);

  const { processTransfer, isLoading } = useTransferOperations();
  const { createWithdrawalRequest } = useWithdrawalRequest();

  const updateFields = useCallback((fields: Partial<TransferData>) => {
    setData((prev) => ({ ...prev, ...fields }));
  }, []);

  const next = useCallback(() => {
    setCurrentStep((i) => Math.min(i + 1, 2));
  }, []);

  const back = useCallback(() => {
    setCurrentStep((i) => Math.max(i - 1, 0));
  }, []);

  const confirmWithdrawal = useCallback(async (verificationCode: string) => {
    const result = await createWithdrawalRequest(
      data.transfer.amount,
      verificationCode
    );
    return result;
  }, [createWithdrawalRequest, data.transfer.amount]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
  }, [currentStep, data, processTransfer, next]);

  const resetForm = useCallback(() => {
    setData(INITIAL_TRANSFER_DATA);
    setCurrentStep(0);
  }, []);

  return {
    currentStep,
    data,
    isLoading,
    updateFields,
    back,
    handleSubmit,
    resetForm,
    confirmWithdrawal
  };
};
