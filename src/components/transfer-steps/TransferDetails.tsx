import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TransferData } from "../TransferForm";
import { useEffect } from "react";

type TransferDetailsProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const TransferDetails = ({ transfer, updateFields }: TransferDetailsProps) => {
  const fees = transfer.amount * 0.02; // 2% de frais
  const total = transfer.amount + fees;

  useEffect(() => {
    // Génère un code aléatoire de 8 caractères si pas déjà généré
    if (!transfer.code) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      updateFields({ transfer: { ...transfer, code } });
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="amount">Montant à Envoyer</Label>
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

      <div className="space-y-2">
        <Label>Code de Transfert</Label>
        <Input
          value={transfer.code}
          readOnly
          className="bg-gray-100 font-mono text-center text-lg"
        />
        <p className="text-sm text-muted-foreground mt-1">
          Ce code sera nécessaire pour le retrait. Partagez-le uniquement avec le bénéficiaire.
        </p>
      </div>

      {transfer.amount > 0 && (
        <div className="mt-6 p-4 bg-secondary rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span>Montant du transfert :</span>
            <span>{transfer.amount.toFixed(2)} {transfer.currency}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Frais (2%) :</span>
            <span>{fees.toFixed(2)} {transfer.currency}</span>
          </div>
          <div className="flex justify-between font-semibold pt-2 border-t">
            <span>Total :</span>
            <span>{total.toFixed(2)} {transfer.currency}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferDetails;