
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TransferData } from "@/types/transfer";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase, calculateFee } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

type TransferDetailsProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const TransferDetails = ({ transfer, recipient, updateFields }: TransferDetailsProps) => {
  // Get current user's role from context
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  
  // For agents, restrict to international transfers only
  useEffect(() => {
    if (userRole === 'agent' && recipient.country && recipient.country === "Cameroun") {
      toast({
        title: "Transfert non autorisé",
        description: "En tant qu'agent, vous ne pouvez effectuer que des transferts internationaux",
        variant: "destructive"
      });
      // Reset the recipient country
      updateFields({
        recipient: { ...recipient, country: "" }
      });
    }
  }, [recipient.country, userRole]);
  
  // Calculate fees using the updated function with fixed 6% rate
  const { fee: fees, rate: feeRate } = calculateFee(
    transfer.amount, 
    "any", // No longer needed as we use fixed rates
    recipient.country, 
    userRole || 'user'
  );
  
  const total = transfer.amount + fees;
  
  // Display fixed fee percentage
  const feePercentageDisplay = userRole === 'agent' ? '6% (2% commission)' : '6%';

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="amount">Montant à Envoyer ({transfer.currency})</Label>
        <Input
          id="amount"
          type="number"
          required
          min="0"
          step="100"
          placeholder={`Entrez le montant en ${transfer.currency}`}
          value={transfer.amount || ""}
          onChange={(e) =>
            updateFields({
              transfer: { ...transfer, amount: parseFloat(e.target.value) },
            })
          }
          className="text-lg"
        />
      </div>

      {transfer.amount > 0 && (
        <div className="mt-6 p-6 bg-primary/5 rounded-xl space-y-3 border border-primary/10">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Montant du transfert :</span>
            <span className="font-medium">
              {transfer.amount.toLocaleString('fr-FR')} {transfer.currency}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              Frais ({feePercentageDisplay}) :
            </span>
            <span className="font-medium">
              {fees.toLocaleString('fr-FR')} {transfer.currency}
            </span>
          </div>
          <div className="flex justify-between font-semibold pt-3 border-t border-primary/10 text-lg">
            <span>Total :</span>
            <span>
              {total.toLocaleString('fr-FR')} {transfer.currency}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferDetails;
