import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransferData } from "../TransferForm";
import { useState } from "react";

type RecipientInfoProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const RecipientInfo = ({ recipient, updateFields }: RecipientInfoProps) => {
  const countries = [
    { name: "Congo Brazzaville", code: "+242", receiveMethods: ["Airtel Money", "Mobile Money"] },
    { name: "Sénégal", code: "+221", receiveMethods: ["Wave", "Orange Money"] },
    { name: "Gabon", code: "+241", receiveMethods: ["Airtel Money"] }
  ];
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [availableReceiveMethods, setAvailableReceiveMethods] = useState<string[]>([]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="recipientCountry">Pays</Label>
        <Select
          value={recipient.country}
          onValueChange={(value) => {
            const country = countries.find(c => c.name === value);
            setSelectedCountryCode(country?.code || "");
            setAvailableReceiveMethods(country?.receiveMethods || []);
            updateFields({
              recipient: { 
                ...recipient, 
                country: value,
                receiveMethod: "" // Reset receive method when country changes
              }
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez le pays" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.name} value={country.name}>
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
        <div className="flex gap-2">
          <div className="w-24">
            <Input
              value={selectedCountryCode}
              readOnly
              className="bg-gray-100"
            />
          </div>
          <Input
            id="recipientPhone"
            type="tel"
            required
            placeholder="XX XXX XXXX"
            value={recipient.phone}
            onChange={(e) =>
              updateFields({ recipient: { ...recipient, phone: e.target.value } })
            }
          />
        </div>
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
          disabled={!recipient.country}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez le mode de réception" />
          </SelectTrigger>
          <SelectContent>
            {availableReceiveMethods.map((method) => (
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