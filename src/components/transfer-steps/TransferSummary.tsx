import { Card } from "@/components/ui/card";
import { TransferData } from "../TransferForm";

type TransferSummaryProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const TransferSummary = ({
  sender,
  recipient,
  transfer,
}: TransferSummaryProps) => {
  const fees = transfer.amount * 0.08;
  const total = transfer.amount + fees;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Résumé du Transfert</h3>
        <p className="text-sm text-muted-foreground">
          Veuillez vérifier les détails de votre transfert
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="p-4 space-y-3">
          <h4 className="font-medium">Informations de l'Expéditeur</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Nom :</span>
            <span>{sender.fullName}</span>
            <span className="text-muted-foreground">Adresse :</span>
            <span>{sender.address}</span>
            <span className="text-muted-foreground">Téléphone :</span>
            <span>{sender.phone}</span>
            <span className="text-muted-foreground">Pays :</span>
            <span>{sender.country}</span>
            <span className="text-muted-foreground">Mode de Paiement :</span>
            <span>{sender.paymentMethod}</span>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <h4 className="font-medium">Informations du Bénéficiaire</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Nom :</span>
            <span>{recipient.fullName}</span>
            <span className="text-muted-foreground">Adresse :</span>
            <span>{recipient.address}</span>
            <span className="text-muted-foreground">Téléphone :</span>
            <span>{recipient.phone}</span>
            <span className="text-muted-foreground">Pays :</span>
            <span>{recipient.country}</span>
            <span className="text-muted-foreground">Mode de Réception :</span>
            <span>{recipient.receiveMethod}</span>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <h4 className="font-medium">Détails du Transfert</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Montant :</span>
            <span>
              {transfer.amount.toFixed(2)} {transfer.currency}
            </span>
            <span className="text-muted-foreground">Frais (8%) :</span>
            <span>
              {fees.toFixed(2)} {transfer.currency}
            </span>
            <span className="text-muted-foreground">Total :</span>
            <span className="font-medium">
              {total.toFixed(2)} {transfer.currency}
            </span>
            <span className="text-muted-foreground">Code de Transfert :</span>
            <span className="font-mono font-medium">{transfer.code}</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TransferSummary;