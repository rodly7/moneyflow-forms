
import { Card } from "@/components/ui/card";
import { TransferData } from "@/types/transfer";

type TransferSummaryProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const TransferSummary = ({ recipient, transfer }: TransferSummaryProps) => {
  const fees = transfer.amount * 0.08;
  const total = transfer.amount + fees;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-primary">Résumé du Transfert</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Veuillez vérifier les détails de votre transfert
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="p-6 space-y-4 bg-white/50">
          <h4 className="font-medium text-lg text-primary">Informations du Bénéficiaire</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <span className="text-muted-foreground">Nom :</span>
            <span className="font-medium">{recipient.fullName}</span>
            <span className="text-muted-foreground">Téléphone :</span>
            <span className="font-medium">{recipient.email}</span>
          </div>
        </Card>

        <Card className="p-6 space-y-4 bg-primary/5 border-primary/10">
          <h4 className="font-medium text-lg text-primary">Détails du Transfert</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <span className="text-muted-foreground">Montant :</span>
            <span className="font-medium">
              {transfer.amount.toLocaleString('fr-FR')} {transfer.currency}
            </span>
            <span className="text-muted-foreground">Frais (8%) :</span>
            <span className="font-medium">
              {fees.toLocaleString('fr-FR')} {transfer.currency}
            </span>
            <span className="text-muted-foreground">Total :</span>
            <span className="font-medium text-lg">
              {total.toLocaleString('fr-FR')} {transfer.currency}
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TransferSummary;
