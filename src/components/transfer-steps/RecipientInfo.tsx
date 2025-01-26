import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransferData } from "../TransferForm";
import { useState, useEffect } from "react";
import { countries } from "@/data/countries";

type RecipientInfoProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const RecipientInfo = ({ recipient, updateFields }: RecipientInfoProps) => {
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [availableReceiveMethods, setAvailableReceiveMethods] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    if (recipient.country) {
      const country = countries.find(c => c.name === recipient.country);
      if (country) {
        setSelectedCountryCode(country.code);
        setAvailableReceiveMethods(country.paymentMethods);
        setAvailableCities(country.cities.map(city => city.name));
      }
    }
  }, [recipient.country]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="recipientCountry">Pays</Label>
        <Select
          value={recipient.country}
          onValueChange={(value) => {
            const country = countries.find(c => c.name === value);
            if (country) {
              setSelectedCountryCode(country.code);
              setAvailableReceiveMethods(country.paymentMethods);
              setAvailableCities(country.cities.map(city => city.name));
              updateFields({
                recipient: { 
                  ...recipient, 
                  country: value,
                  city: "", // Reset city when country changes
                  receiveMethod: "" // Reset receive method when country changes
                }
              });
            }
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
        <Label htmlFor="recipientCity">Ville</Label>
        <Select
          value={recipient.city}
          onValueChange={(value) =>
            updateFields({ recipient: { ...recipient, city: value } })
          }
          disabled={!recipient.country}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez la ville" />
          </SelectTrigger>
          <SelectContent>
            {availableCities.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
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