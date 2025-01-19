import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransferData } from "../TransferForm";

type SenderInfoProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const SenderInfo = ({ sender, updateFields }: SenderInfoProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Nom Complet</Label>
        <Input
          id="fullName"
          type="text"
          required
          placeholder="Comme indiqué sur la pièce d'identité"
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
          placeholder="+33612345678"
          value={sender.phone}
          onChange={(e) =>
            updateFields({ sender: { ...sender, phone: e.target.value } })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="idType">Type de Pièce d'Identité</Label>
        <Select
          value={sender.idType}
          onValueChange={(value) =>
            updateFields({ sender: { ...sender, idType: value } })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez le type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="passport">Passeport</SelectItem>
            <SelectItem value="nationalId">Carte d'Identité</SelectItem>
            <SelectItem value="drivingLicense">Permis de Conduire</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="idNumber">Numéro de Pièce d'Identité</Label>
        <Input
          id="idNumber"
          type="text"
          required
          placeholder="Entrez le numéro"
          value={sender.idNumber}
          onChange={(e) =>
            updateFields({ sender: { ...sender, idNumber: e.target.value } })
          }
        />
      </div>
    </div>
  );
};

export default SenderInfo;