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
    // Ensure the phone number starts with +
    let formattedValue = value.startsWith('+') ? value : `+${value}`;
    
    // Only allow + and digits
    if (/^\+?\d*$/.test(formattedValue)) {
      console.log("Formatting phone number:", formattedValue); // Debug log
      
      updateFields({ 
        recipient: { 
          ...recipient, 
          phone: formattedValue,
          fullName: '', // Reset name when phone changes
        } 
      });
      setIsValidNumber(false);

      // Search for recipient if number is complete (at least 12 chars including +)
      if (formattedValue.length >= 12) {
        searchRecipient(formattedValue);
      }
    }
  };

  const searchRecipient = async (phoneNumber: string) => {
    try {
      console.log("Searching for recipient with phone:", phoneNumber); // Debug log

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, country, phone')
        .eq('phone', phoneNumber)
        .maybeSingle();

      console.log("Search result:", { profile, error }); // Debug log

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      if (!profile) {
        console.log("No user found for phone:", phoneNumber);
        toast({
          title: "Utilisateur non trouvé",
          description: "Ce numéro n'est pas enregistré dans notre système",
          variant: "destructive"
        });
        setIsValidNumber(false);
        return;
      }

      // Verify exact phone number match
      if (profile.phone === phoneNumber) {
        console.log("User found:", profile);
        updateFields({
          recipient: {
            ...recipient,
            fullName: profile.full_name || '',
            country: profile.country || recipient.country,
            phone: phoneNumber
          }
        });

        setIsValidNumber(true);
        toast({
          title: "Utilisateur trouvé",
          description: "Les informations ont été remplies automatiquement",
        });
      } else {
        console.log("Phone number mismatch:", { stored: profile.phone, input: phoneNumber });
        setIsValidNumber(false);
        toast({
          title: "Numéro invalide",
          description: "Le format du numéro ne correspond pas",
          variant: "destructive"
        });
      }
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
          placeholder="Nom complet du bénéficiaire"
          className={isValidNumber ? 'bg-gray-100' : ''}
          readOnly={isValidNumber}
        />
      </div>
    </div>
  );
};

export default RecipientInfo;