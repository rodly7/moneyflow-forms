import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransferData } from "../TransferForm";
import { useState } from "react";

type SenderInfoProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const SenderInfo = ({ sender, updateFields }: SenderInfoProps) => {
  const countries = [
    { name: "Congo Brazzaville", code: "+242", paymentMethods: ["Airtel Money", "Mobile Money"] },
    { name: "Sénégal", code: "+221", paymentMethods: ["Wave", "Orange Money"] },
    { name: "Gabon", code: "+241", paymentMethods: ["Airtel Money"] }
  ];
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<string[]>([]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="country">Pays</Label>
        <Select
          value={sender.country}
          onValueChange={(value) => {
            const country = countries.find(c => c.name === value);
            setSelectedCountryCode(country?.code || "");
            setAvailablePaymentMethods(country?.paymentMethods || []);
            updateFields({ 
              sender: { 
                ...sender, 
                country: value,
                paymentMethod: "" // Reset payment method when country changes
              } 
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez votre pays" />
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
        <div className="flex gap-2">
          <div className="w-24">
            <Input
              value={selectedCountryCode}
              readOnly
              className="bg-gray-100"
            />
          </div>
          <Input
            id="phone"
            type="tel"
            required
            placeholder="XX XXX XXXX"
            value={sender.phone}
            onChange={(e) =>
              updateFields({ sender: { ...sender, phone: e.target.value } })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentMethod">Mode de Paiement</Label>
        <Select
          value={sender.paymentMethod}
          onValueChange={(value) =>
            updateFields({ sender: { ...sender, paymentMethod: value } })
          }
          disabled={!sender.country}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez le mode de paiement" />
          </SelectTrigger>
          <SelectContent>
            {availablePaymentMethods.map((method) => (
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