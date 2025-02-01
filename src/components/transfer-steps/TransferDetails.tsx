import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TransferData } from "../TransferForm";
import { useEffect, useState } from "react";

type TransferDetailsProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const TransferDetails = ({ transfer, sender, updateFields }: TransferDetailsProps) => {
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  
  // Taux de conversion (à titre d'exemple)
  const exchangeRates = {
    "Congo Brazzaville": { currency: "XAF", rate: 1 },
    "Sénégal": { currency: "XOF", rate: 1 },
    "Gabon": { currency: "XAF", rate: 1 }
  };

  const fees = transfer.amount * 0.08; // 8% de frais
  const total = transfer.amount + fees;

  useEffect(() => {
    if (sender.country && transfer.amount) {
      const rate = exchangeRates[sender.country as keyof typeof exchangeRates].rate;
      const converted = transfer.amount * rate;
      setConvertedAmount(converted);
    }
  }, [transfer.amount, sender.country]);

  const currentCurrency = exchangeRates[sender.country as keyof typeof exchangeRates]?.currency || "XAF";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="amount">Montant à Envoyer ({currentCurrency})</Label>
        <Input
          id="amount"
          type="number"
          required
          min="0"
          step="100"
          placeholder={`Entrez le montant en ${currentCurrency}`}
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
            <span className="font-medium">{transfer.amount.toLocaleString('fr-FR')} {currentCurrency}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Frais (8%) :</span>
            <span className="font-medium">{fees.toLocaleString('fr-FR')} {currentCurrency}</span>
          </div>
          <div className="flex justify-between font-semibold pt-3 border-t border-primary/10 text-lg">
            <span>Total :</span>
            <span>{total.toLocaleString('fr-FR')} {currentCurrency}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferDetails;