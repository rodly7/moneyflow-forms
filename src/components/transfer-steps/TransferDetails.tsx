import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TransferData } from "../TransferForm";

type TransferDetailsProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const TransferDetails = ({ transfer, updateFields }: TransferDetailsProps) => {
  const currencies = ["EUR", "USD", "GBP", "JPY", "AUD", "CAD", "CHF"];
  const fees = transfer.amount * 0.01;
  const total = transfer.amount + fees;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Montant</Label>
          <Input
            id="amount"
            type="number"
            required
            min="0"
            step="0.01"
            placeholder="Entrez le montant"
            value={transfer.amount || ""}
            onChange={(e) =>
              updateFields({
                transfer: { ...transfer, amount: parseFloat(e.target.value) },
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Devise</Label>
          <Select
            value={transfer.currency}
            onValueChange={(value) =>
              updateFields({ transfer: { ...transfer, currency: value } })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez la devise" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reason">Motif du Transfert</Label>
        <Textarea
          id="reason"
          required
          placeholder="Veuillez préciser le motif de ce transfert"
          value={transfer.reason}
          onChange={(e) =>
            updateFields({ transfer: { ...transfer, reason: e.target.value } })
          }
        />
      </div>

      {transfer.amount > 0 && (
        <div className="mt-6 p-4 bg-secondary rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span>Montant du transfert :</span>
            <span>
              {transfer.amount.toFixed(2)} {transfer.currency}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Frais (1%) :</span>
            <span>
              {fees.toFixed(2)} {transfer.currency}
            </span>
          </div>
          <div className="flex justify-between font-semibold pt-2 border-t">
            <span>Total :</span>
            <span>
              {total.toFixed(2)} {transfer.currency}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferDetails;