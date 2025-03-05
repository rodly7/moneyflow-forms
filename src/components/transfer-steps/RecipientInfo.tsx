
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TransferData } from "@/types/transfer";
import { useToast } from "@/hooks/use-toast";
import { Check } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { countries } from "@/data/countries";
import PhoneInput from "./PhoneInput";
import { useRecipientVerification } from "@/hooks/useRecipientVerification";

type RecipientInfoProps = {
  recipient: TransferData['recipient'];
  updateFields: (fields: Partial<TransferData>) => void;
};

type SuggestionType = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  country: string;
  display_name?: string;
};

const RecipientInfo = ({ recipient, updateFields }: RecipientInfoProps) => {
  const [suggestions, setSuggestions] = useState<SuggestionType[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const { toast } = useToast();

  const {
    isLoading,
    recipientVerified,
    verifyRecipient,
    setRecipientVerified
  } = useRecipientVerification();

  // Mettre à jour l'indicatif téléphonique lorsque le pays change
  useEffect(() => {
    if (recipient.country) {
      const selectedCountry = countries.find(c => c.name === recipient.country);
      if (selectedCountry) {
        setCountryCode(selectedCountry.code);
        
        // Si on change pour Congo Brazzaville, réinitialiser la vérification
        if (selectedCountry.name === "Congo Brazzaville") {
          setRecipientVerified(false);
          console.log("Pays changé pour Congo Brazzaville");
        }
      }
    }
  }, [recipient.country]);

  // Mettre à jour le champ email complet (avec préfixe) lorsque l'input ou l'indicatif change
  useEffect(() => {
    if (phoneInput) {
      // Format the phone number with country code
      const formattedPhone = phoneInput.startsWith('+') 
        ? phoneInput 
        : `${countryCode}${phoneInput.startsWith('0') ? phoneInput.substring(1) : phoneInput}`;
      
      updateFields({
        recipient: {
          ...recipient,
          email: formattedPhone,
        }
      });
    }
  }, [phoneInput, countryCode]);

  const handleVerifyRecipient = async (identifier: string) => {
    console.log("Vérification du destinataire:", identifier);
    console.log("Code pays utilisé:", countryCode);
    
    const result = await verifyRecipient(identifier, countryCode, recipient);
    
    if (result.recipientData) {
      console.log("Résultat de la vérification:", result);
      updateFields({
        recipient: {
          ...recipient,
          ...result.recipientData
        }
      });
    }
  };

  const handleCountryChange = (value: string) => {
    const selectedCountry = countries.find(c => c.name === value);
    
    updateFields({
      recipient: {
        ...recipient,
        country: value,
      }
    });
    
    if (selectedCountry) {
      setCountryCode(selectedCountry.code);
    }
    
    // Réinitialiser la vérification si le pays change
    setRecipientVerified(false);
  };

  const handlePhoneInput = (value: string) => {
    setPhoneInput(value);
    // Réinitialiser la vérification si le numéro change
    if (recipientVerified) {
      setRecipientVerified(false);
    }
  };

  // Fonction pour déclencher la vérification automatique lorsque le numéro est complet
  const handlePhoneComplete = () => {
    if (phoneInput && phoneInput.length >= 8) {
      const formattedPhone = phoneInput.startsWith('+') 
        ? phoneInput 
        : `${countryCode}${phoneInput.startsWith('0') ? phoneInput.substring(1) : phoneInput}`;
      
      console.log("Vérification automatique déclenchée pour:", formattedPhone);
      handleVerifyRecipient(formattedPhone);
    }
  };

  const selectSuggestion = (suggestion: SuggestionType) => {
    updateFields({
      recipient: {
        ...recipient,
        email: suggestion.phone || suggestion.email, // Priorité au téléphone si disponible
        fullName: suggestion.display_name || suggestion.full_name,
        country: suggestion.country || recipient.country,
      }
    });
    setSuggestions([]);
    setShowSuggestions(false);
    setRecipientVerified(true);
    
    // Mettre à jour l'input du téléphone pour afficher le numéro sans l'indicatif
    setPhoneInput(suggestion.phone.replace(countryCode, ""));
    
    toast({
      title: "Bénéficiaire sélectionné",
      description: suggestion.display_name || suggestion.full_name || suggestion.phone || suggestion.email,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Pays du bénéficiaire</Label>
        <Select 
          value={recipient.country} 
          onValueChange={handleCountryChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionnez un pays" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.name} value={country.name}>
                {country.name} ({country.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <PhoneInput 
        phoneInput={phoneInput}
        countryCode={countryCode}
        onPhoneChange={handlePhoneInput}
        isLoading={isLoading}
        isVerified={recipientVerified}
        label="Numéro de téléphone du bénéficiaire"
        recipientName={recipientVerified ? recipient.fullName : undefined}
        onBlurComplete={handlePhoneComplete}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="mt-2 border rounded-md overflow-hidden bg-white shadow-sm">
          <div className="p-2 bg-gray-50 border-b text-sm font-medium">
            Suggestions
          </div>
          <ul className="max-h-60 overflow-auto">
            {suggestions.map((suggestion, index) => (
              <li 
                key={index} 
                className="p-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                onClick={() => selectSuggestion(suggestion)}
              >
                <div>
                  <div className="font-medium">{suggestion.display_name || suggestion.full_name}</div>
                  <div className="text-sm text-gray-500">
                    {suggestion.phone || suggestion.email}
                  </div>
                </div>
                <div className="text-emerald-500">
                  <Check className="w-4 h-4" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="fullName">Nom Complet du Bénéficiaire</Label>
        <Input
          id="fullName"
          type="text"
          required
          placeholder="Nom complet du bénéficiaire"
          value={recipient.fullName}
          onChange={(e) => {
            updateFields({
              recipient: {
                ...recipient,
                fullName: e.target.value,
              }
            });
          }}
          className={recipientVerified ? "border-green-500" : ""}
          readOnly={recipientVerified}
        />
        {recipientVerified && (
          <p className="text-xs text-green-600 mt-1">
            Le bénéficiaire a été vérifié et recevra directement l'argent sur son compte
          </p>
        )}
        {!recipientVerified && recipient.fullName && recipient.fullName !== "Nouveau destinataire" && (
          <p className="text-xs text-amber-600 mt-1">
            Ce destinataire n'est pas encore enregistré dans le système. Il recevra un code pour réclamer le transfert.
          </p>
        )}
      </div>
    </div>
  );
};

export default RecipientInfo;
