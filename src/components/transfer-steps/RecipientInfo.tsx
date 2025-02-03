import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransferData } from "../TransferForm";
import { useState } from "react";
import { countries } from "@/data/countries";
import { Button } from "@/components/ui/button";
import { Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type RecipientInfoProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const RecipientInfo = ({ recipient, updateFields }: RecipientInfoProps) => {
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const { toast } = useToast();

  const handlePhoneChange = (value: string) => {
    // Accepter uniquement + au début et des chiffres ensuite
    if (/^\+?\d*$/.test(value)) {
      updateFields({ 
        recipient: { 
          ...recipient, 
          phone: value 
        } 
      });

      // Si le numéro est complet (au moins 10 chiffres après le +), rechercher le bénéficiaire
      if (value.length > 10) {
        searchRecipient(value);
      }
    }
  };

  const searchRecipient = async (phoneNumber: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, country')
        .eq('phone', phoneNumber)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          title: "Utilisateur non trouvé",
          description: "Aucun utilisateur trouvé avec ce numéro de téléphone",
          variant: "destructive"
        });
        return;
      }

      updateFields({
        recipient: {
          ...recipient,
          fullName: data.full_name || '',
          country: data.country || recipient.country,
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
                  phone: '', // Reset phone when country changes
                  fullName: '', // Reset name when country changes
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
        <Label htmlFor="phone">Numéro de téléphone</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+242XXXXXXXXX"
          value={recipient.phone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          className="w-full"
          maxLength={13}
        />
      </div>

      {recipient.fullName && (
        <div className="space-y-2">
          <Label htmlFor="fullName">Nom du bénéficiaire</Label>
          <Input
            id="fullName"
            value={recipient.fullName}
            readOnly
            className="bg-gray-100"
          />
        </div>
      )}
    </div>
  );
};

export default RecipientInfo;