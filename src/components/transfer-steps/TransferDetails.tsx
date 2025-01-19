import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TransferData } from "../TransferForm";
import { useEffect } from "react";

type TransferDetailsProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const TransferDetails = ({ transfer, updateFields }: TransferDetailsProps) => {
  const fees = transfer.amount * 0.08; // 8% de frais
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
        <Label htmlFor="amount">Montant à Envoyer (FCFA)</Label>
        <Input
          id="amount"
          type="number"
          required
          min="0"
          step="100"
          placeholder="Entrez le montant en FCFA"
          value={transfer.amount || ""}
          onChange={(e) =>
            updateFields({
              transfer: { ...transfer, amount: parseFloat(e.target.value) },
            })
          }
          className="text-lg"
        />
      </div>

      <div className="space-y-2">
        <Label>Code de Transfert</Label>
        <Input
          value={transfer.code}
          readOnly
          className="bg-gray-100 font-mono text-center text-lg tracking-wider"
        />
        <p className="text-sm text-muted-foreground mt-1">
          Ce code sera nécessaire pour le retrait. Partagez-le uniquement avec le bénéficiaire.
        </p>
      </div>

      {transfer.amount > 0 && (
        <div className="mt-6 p-6 bg-primary/5 rounded-xl space-y-3 border border-primary/10">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Montant du transfert :</span>
            <span className="font-medium">{transfer.amount.toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Frais (8%) :</span>
            <span className="font-medium">{fees.toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div className="flex justify-between font-semibold pt-3 border-t border-primary/10 text-lg">
            <span>Total :</span>
            <span>{total.toLocaleString('fr-FR')} FCFA</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferDetails;