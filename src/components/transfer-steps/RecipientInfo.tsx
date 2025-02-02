import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransferData } from "../TransferForm";
import { useState } from "react";
import { countries } from "@/data/countries";
import { Button } from "@/components/ui/button";
import { Flag, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type RecipientInfoProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const RecipientInfo = ({ recipient, updateFields }: RecipientInfoProps) => {
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const { toast } = useToast();

  const searchRecipient = async () => {
    if (!recipient.phone || !recipient.country) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un pays et entrer un numéro de téléphone",
        variant: "destructive"
      });
      return;
    }

    try {
      // Format phone number with country code if not already present
      let formattedPhone = recipient.phone;
      if (!formattedPhone.startsWith('+')) {
        // Remove any leading zeros from the phone number
        const cleanPhone = formattedPhone.replace(/^0+/, '');
        formattedPhone = `${selectedCountryCode}${cleanPhone}`;
      }

      console.log('Searching for phone number:', formattedPhone);

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

      // Update recipient information with found user data
      updateFields({
        recipient: {
          ...recipient,
          fullName: data.full_name || '',
          country: data.country || '',
          phone: formattedPhone,
          city: data.city || ''
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
        <Label htmlFor="country">Pays du bénéficiaire</Label>
        <Select
          value={recipient.country}
          onValueChange={(value) => {
            const country = countries.find(c => c.name === value);
            if (country) {
              setSelectedCountryCode(country.code);
              updateFields({ 
                recipient: { 
                  ...recipient, 
                  country: value,
                  city: ""
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
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4" />
                  <span>{country.name}</span>
                </div>
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
    </div>
  );
};

export default RecipientInfo;