import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransferData } from "../TransferForm";
import { useState } from "react";
import { countries } from "@/data/countries";
import { Flag, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type RecipientInfoProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const RecipientInfo = ({ recipient, updateFields }: RecipientInfoProps) => {
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [isValidNumber, setIsValidNumber] = useState(false);
  const { toast } = useToast();

  const handlePhoneChange = (value: string) => {
    // Accepter uniquement + au début et des chiffres ensuite
    if (/^\+?\d*$/.test(value)) {
      const formattedValue = value.startsWith('+') ? value : `+${value}`;
      updateFields({ 
        recipient: { 
          ...recipient, 
          phone: formattedValue,
          fullName: '', // Reset name when phone changes
        } 
      });
      setIsValidNumber(false);

      // Si le numéro est complet (au moins 10 chiffres après le +), rechercher le bénéficiaire
      if (formattedValue.length >= 10) {
        console.log("Searching for phone number:", formattedValue); // Debug log
        searchRecipient(formattedValue);
      }
    }
  };

  const handleNameChange = (value: string) => {
    updateFields({
      recipient: {
        ...recipient,
        fullName: value
      }
    });
  };

  const searchRecipient = async (phoneNumber: string) => {
    try {
      console.log("Searching for recipient with phone:", phoneNumber); // Debug log

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, country')
        .eq('phone', phoneNumber)
        .maybeSingle();

      console.log("Search result:", { data, error }); // Debug log

      if (error) {
        console.error('Database error:', error); // Debug log
        throw error;
      }

      if (!data) {
        console.log("No user found for phone:", phoneNumber); // Debug log
        toast({
          title: "Utilisateur non trouvé",
          description: "Aucun utilisateur trouvé avec ce numéro de téléphone",
          variant: "destructive"
        });
        setIsValidNumber(false);
        return;
      }

      console.log("User found:", data); // Debug log

      updateFields({
        recipient: {
          ...recipient,
          fullName: data.full_name || '',
          country: data.country || recipient.country,
        }
      });

      setIsValidNumber(true);
      toast({
        title: "Utilisateur trouvé",
        description: "Les informations ont été remplies automatiquement",
      });
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setIsValidNumber(false);
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
        <div className="relative">
          <Input
            id="phone"
            type="tel"
            placeholder="+242XXXXXXXXX"
            value={recipient.phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            className={`w-full pr-10 ${isValidNumber ? 'border-green-500' : ''}`}
            maxLength={13}
          />
          {isValidNumber && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Check className="h-5 w-5 text-green-500" />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Nom du bénéficiaire</Label>
        <Input
          id="fullName"
          value={recipient.fullName}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Nom complet du bénéficiaire"
          className={isValidNumber ? 'bg-gray-100' : ''}
          readOnly={isValidNumber}
        />
      </div>
    </div>
  );
};

export default RecipientInfo;