import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransferData } from "../TransferForm";
import { useState, useEffect } from "react";
import { countries } from "@/data/countries";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type RecipientInfoProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const RecipientInfo = ({ recipient, updateFields }: RecipientInfoProps) => {
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [availableReceiveMethods, setAvailableReceiveMethods] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const { toast } = useToast();

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

  const searchRecipient = async () => {
    if (!recipient.phone) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un numéro de téléphone",
        variant: "destructive"
      });
      return;
    }

    // Format phone number with country code if not already present
    let formattedPhone = recipient.phone;
    if (!formattedPhone.startsWith('+')) {
      // Remove any leading zeros from the phone number
      const cleanPhone = formattedPhone.replace(/^0+/, '');
      formattedPhone = `${selectedCountryCode}${cleanPhone}`;
    }

    console.log('Searching for phone number:', formattedPhone);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', formattedPhone)
        .maybeSingle();

      if (error) {
        console.error('Error searching for recipient:', error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la recherche",
          variant: "destructive"
        });
        return;
      }

      if (!data) {
        console.log('No user found with phone number:', formattedPhone);
        toast({
          title: "Utilisateur non trouvé",
          description: "Aucun utilisateur trouvé avec ce numéro de téléphone",
          variant: "destructive"
        });
        return;
      }

      console.log('User found:', data);

      updateFields({
        recipient: {
          ...recipient,
          fullName: data.full_name || '',
          address: data.address || '',
          country: data.country || '',
          phone: formattedPhone
        }
      });

      toast({
        title: "Utilisateur trouvé",
        description: "Les informations ont été remplies automatiquement",
      });
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la recherche",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="country">Pays</Label>
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
                  city: "",
                  receiveMethod: ""
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
            value={recipient.phone}
            onChange={(e) =>
              updateFields({ recipient: { ...recipient, phone: e.target.value } })
            }
          />
          <Button 
            type="button" 
            variant="outline"
            onClick={searchRecipient}
            className="px-3"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Nom Complet</Label>
        <Input
          id="fullName"
          type="text"
          required
          placeholder="Nom complet du bénéficiaire"
          value={recipient.fullName}
          onChange={(e) =>
            updateFields({ recipient: { ...recipient, fullName: e.target.value } })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Adresse</Label>
        <Input
          id="address"
          type="text"
          required
          placeholder="Adresse du bénéficiaire"
          value={recipient.address}
          onChange={(e) =>
            updateFields({ recipient: { ...recipient, address: e.target.value } })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">Ville</Label>
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
        <Label htmlFor="receiveMethod">Mode de Réception</Label>
        <Select
          value={recipient.receiveMethod}
          onValueChange={(value) =>
            updateFields({ recipient: { ...recipient, receiveMethod: value } })
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
