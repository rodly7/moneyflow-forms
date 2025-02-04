import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransferData } from "../TransferForm";
import { useState, useEffect } from "react";
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
  const [phoneWithoutCode, setPhoneWithoutCode] = useState("");
  const { toast } = useToast();

  // Update phone number when country changes or phone input changes
  useEffect(() => {
    if (selectedCountryCode && phoneWithoutCode) {
      const fullNumber = `${selectedCountryCode}${phoneWithoutCode}`;
      handlePhoneChange(fullNumber);
    }
  }, [selectedCountryCode, phoneWithoutCode]);

  const handlePhoneChange = async (fullNumber: string) => {
    // Only allow digits for the phone part
    if (/^\+\d*$/.test(fullNumber)) {
      console.log("Full phone number:", fullNumber);
      
      updateFields({ 
        recipient: { 
          ...recipient, 
          phone: fullNumber,
          fullName: '', // Reset name when phone changes
        } 
      });
      setIsValidNumber(false);

      // Search for recipient if number is complete (at least 12 chars including +)
      if (fullNumber.length >= 12) {
        await searchRecipient(fullNumber);
      }
    }
  };

  const searchRecipient = async (phoneNumber: string) => {
    try {
      console.log("Searching for recipient with phone:", phoneNumber);

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, country, phone')
        .eq('phone', phoneNumber)
        .maybeSingle();

      console.log("Search result:", { profile, error });

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
              setPhoneWithoutCode(""); // Reset phone input when country changes
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
        <div className="relative flex gap-2">
          <div className="w-24">
            <Input
              value={selectedCountryCode}
              readOnly
              className="bg-gray-100"
              placeholder="+XXX"
            />
          </div>
          <div className="flex-1">
            <Input
              id="phone"
              type="tel"
              placeholder="XXXXXXXXX"
              value={phoneWithoutCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                setPhoneWithoutCode(value);
              }}
              className={`w-full pr-10 ${isValidNumber ? 'border-green-500' : ''}`}
              maxLength={9}
            />
          </div>
          {isValidNumber && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Check className="h-5 w-5 text-green-500" />
            </div>
          )}
        </div>
      </div>

      {isValidNumber && (
        <div className="space-y-2">
          <Label htmlFor="fullName">Nom du bénéficiaire</Label>
          <Input
            id="fullName"
            value={recipient.fullName}
            placeholder="Nom complet du bénéficiaire"
            className="bg-gray-100"
            readOnly
          />
        </div>
      )}
    </div>
  );
};

export default RecipientInfo;