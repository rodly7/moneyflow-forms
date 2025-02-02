import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransferData } from "../TransferForm";
import { useState, useEffect } from "react";
import { countries } from "@/data/countries";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type SenderInfoProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

// Update the sender type in TransferData to include address and paymentMethod
type Sender = {
  fullName: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  paymentMethod: string;
};

const SenderInfo = ({ sender, updateFields }: SenderInfoProps) => {
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const { user } = useAuth();

  // Fetch user profile data
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Pre-fill sender information when profile data is loaded
  useEffect(() => {
    if (profile) {
      updateFields({
        sender: {
          ...sender,
          fullName: profile.full_name || '',
          phone: profile.phone || '',
          address: profile.address || '',
          country: profile.country || '',
          city: sender.city || '',
          paymentMethod: sender.paymentMethod || '',
        }
      });
    }
  }, [profile]);

  useEffect(() => {
    if (sender.country) {
      const country = countries.find(c => c.name === sender.country);
      if (country) {
        setSelectedCountryCode(country.code);
        setAvailablePaymentMethods(country.paymentMethods);
        setAvailableCities(country.cities.map(city => city.name));
      }
    }
  }, [sender.country]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="country">Pays</Label>
        <Select
          value={sender.country}
          onValueChange={(value) => {
            const country = countries.find(c => c.name === value);
            if (country) {
              setSelectedCountryCode(country.code);
              setAvailablePaymentMethods(country.paymentMethods);
              setAvailableCities(country.cities.map(city => city.name));
              updateFields({ 
                sender: { 
                  ...sender, 
                  country: value,
                  city: "",
                  paymentMethod: ""
                } 
              });
            }
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
        <Label htmlFor="city">Ville</Label>
        <Select
          value={sender.city}
          onValueChange={(value) =>
            updateFields({ sender: { ...sender, city: value } })
          }
          disabled={!sender.country}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez votre ville" />
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