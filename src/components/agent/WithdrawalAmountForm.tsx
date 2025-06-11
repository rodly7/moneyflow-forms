
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/integrations/supabase/client";

interface ClientData {
  id: string;
  full_name: string;
  phone: string;
  balance: number;
}

interface WithdrawalAmountFormProps {
  amount: string;
  clientData: ClientData | null;
  onAmountChange: (value: string) => void;
}

export const WithdrawalAmountForm = ({ 
  amount, 
  clientData, 
  onAmountChange 
}: WithdrawalAmountFormProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="amount">Montant du retrait (XAF)</Label>
      <Input
        id="amount"
        type="number"
        placeholder="Entrez le montant"
        value={amount}
        onChange={(e) => onAmountChange(e.target.value)}
        required
        className="h-12 text-lg"
        disabled={!clientData}
      />
      {amount && clientData && Number(amount) > clientData.balance && (
        <p className="text-red-600 text-sm">
          Le montant dépasse le solde du client
        </p>
      )}
    </div>
  );
};
