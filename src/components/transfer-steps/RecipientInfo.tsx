import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TransferData } from "../TransferForm";

type RecipientInfoProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const RecipientInfo = ({ recipient, updateFields }: RecipientInfoProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="recipientName">Nom Complet</Label>
        <Input
          id="recipientName"
          type="text"
          required
          placeholder="Nom complet du bénéficiaire"
          value={recipient.fullName}
          onChange={(e) =>
            updateFields({
              recipient: { ...recipient, fullName: e.target.value },
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recipientAddress">Adresse</Label>
        <Input
          id="recipientAddress"
          type="text"
          required
          placeholder="Adresse du bénéficiaire"
          value={recipient.address}
          onChange={(e) =>
            updateFields({
              recipient: { ...recipient, address: e.target.value },
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recipientPhone">Numéro de Téléphone</Label>
        <Input
          id="recipientPhone"
          type="tel"
          required
          placeholder="+33612345678"
          value={recipient.phone}
          onChange={(e) =>
            updateFields({ recipient: { ...recipient, phone: e.target.value } })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bankName">Nom de la Banque</Label>
        <Input
          id="bankName"
          type="text"
          required
          placeholder="Nom de la banque du bénéficiaire"
          value={recipient.bankName}
          onChange={(e) =>
            updateFields({
              recipient: { ...recipient, bankName: e.target.value },
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="accountNumber">Numéro de Compte / IBAN</Label>
        <Input
          id="accountNumber"
          type="text"
          required
          placeholder="Numéro de compte ou IBAN"
          value={recipient.accountNumber}
          onChange={(e) =>
            updateFields({
              recipient: { ...recipient, accountNumber: e.target.value },
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="swiftCode">Code SWIFT/BIC</Label>
        <Input
          id="swiftCode"
          type="text"
          required
          placeholder="Code SWIFT ou BIC de la banque"
          value={recipient.swiftCode}
          onChange={(e) =>
            updateFields({
              recipient: { ...recipient, swiftCode: e.target.value },
            })
          }
        />
      </div>
    </div>
  );
};

export default RecipientInfo;