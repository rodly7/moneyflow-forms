import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransferData } from "../TransferForm";

type RecipientInfoProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const RecipientInfo = ({ recipient, updateFields }: RecipientInfoProps) => {
  const countries = ["Congo Brazzaville", "Sénégal", "Gabon"];
  const receiveMethods = ["Wave", "Orange Money"];

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
          placeholder="+242 XX XXX XXXX"
          value={recipient.phone}
          onChange={(e) =>
            updateFields({ recipient: { ...recipient, phone: e.target.value } })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recipientCountry">Pays</Label>
        <Select
          value={recipient.country}
          onValueChange={(value) =>
            updateFields({
              recipient: { ...recipient, country: value },
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez le pays" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="receiveMethod">Mode de Réception</Label>
        <Select
          value={recipient.receiveMethod}
          onValueChange={(value) =>
            updateFields({
              recipient: { ...recipient, receiveMethod: value },
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez le mode de réception" />
          </SelectTrigger>
          <SelectContent>
            {receiveMethods.map((method) => (
              <SelectItem key={method} value={method}>
                {method}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default RecipientInfo;