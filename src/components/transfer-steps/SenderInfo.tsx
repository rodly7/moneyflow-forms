import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransferData } from "../TransferForm";

type SenderInfoProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const SenderInfo = ({ sender, updateFields }: SenderInfoProps) => {
  const countries = ["Congo Brazzaville", "Sénégal", "Gabon"];
  const paymentMethods = ["Airtel Money", "Mobile Money"];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Nom Complet</Label>
        <Input
          id="fullName"
          type="text"
          required
          placeholder="Votre nom complet"
          value={sender.fullName}
          onChange={(e) =>
            updateFields({ sender: { ...sender, fullName: e.target.value } })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Adresse</Label>
        <Input
          id="address"
          type="text"
          required
          placeholder="Votre adresse actuelle"
          value={sender.address}
          onChange={(e) =>
            updateFields({ sender: { ...sender, address: e.target.value } })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Numéro de Téléphone</Label>
        <Input
          id="phone"
          type="tel"
          required
          placeholder="+242 XX XXX XXXX"
          value={sender.phone}
          onChange={(e) =>
            updateFields({ sender: { ...sender, phone: e.target.value } })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="country">Pays</Label>
        <Select
          value={sender.country}
          onValueChange={(value) =>
            updateFields({ sender: { ...sender, country: value } })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez votre pays" />
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
        <Label htmlFor="paymentMethod">Mode de Paiement</Label>
        <Select
          value={sender.paymentMethod}
          onValueChange={(value) =>
            updateFields({ sender: { ...sender, paymentMethod: value } })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez le mode de paiement" />
          </SelectTrigger>
          <SelectContent>
            {paymentMethods.map((method) => (
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

export default SenderInfo;