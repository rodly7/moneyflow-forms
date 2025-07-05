import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransferData } from "@/types/transfer";
import { countries } from "@/data/countries";
import { useAuth } from "@/contexts/AuthContext";
import { useUserSearch } from "@/hooks/useUserSearch";
import { useState, useEffect } from "react";
import { User, Check, Loader2 } from "lucide-react";
import PhoneInput from "./PhoneInput";

type RecipientInfoProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const RecipientInfo = ({ recipient, updateFields }: RecipientInfoProps) => {
  const { userRole, profile } = useAuth();
  const { searchUserByPhone, isSearching } = useUserSearch();
  const [phoneInput, setPhoneInput] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [foundUserName, setFoundUserName] = useState("");
  
  const userCountry = profile?.country || "Cameroun";
  
  // Set default country on component mount
  useEffect(() => {
    if (!recipient.country && userCountry) {
      updateFields({
        recipient: { 
          ...recipient, 
          country: userCountry
        }
      });
    }
  }, [userCountry, recipient, updateFields]);
  
  // Get country code based on selected country
  const getCountryCode = (countryName: string) => {
    const country = countries.find(c => c.name === countryName);
    return country ? country.code : "+237";
  };

  const selectedCountryCode = getCountryCode(recipient.country);

  // Handle country selection
  const handleCountryChange = (countryName: string) => {
    updateFields({
      recipient: { 
        ...recipient, 
        country: countryName,
        phone: "" // Reset phone when country changes
      }
    });
    setPhoneInput("");
    setIsVerified(false);
    setFoundUserName("");
  };

  // Handle phone number search
  const handlePhoneSearch = async () => {
    if (!phoneInput || phoneInput.length < 6) {
      setIsVerified(false);
      setFoundUserName("");
      return;
    }

    try {
      // Construct full phone number with country code
      const fullPhoneNumber = selectedCountryCode + phoneInput;
      console.log("🔍 Recherche du destinataire:", fullPhoneNumber);
      
      const foundUser = await searchUserByPhone(fullPhoneNumber);
      
      if (foundUser) {
        console.log("✅ Utilisateur trouvé:", foundUser);
        setIsVerified(true);
        setFoundUserName(foundUser.full_name || "Utilisateur");
        
        // Auto-fill recipient information
        updateFields({
          recipient: {
            ...recipient,
            fullName: foundUser.full_name || "",
            phone: fullPhoneNumber,
            country: foundUser.country || recipient.country
          }
        });
      } else {
        console.log("ℹ️ Aucun utilisateur trouvé");
        setIsVerified(false);
        setFoundUserName("");
        
        // Update phone number but keep other fields for manual entry
        updateFields({
          recipient: {
            ...recipient,
            phone: fullPhoneNumber
          }
        });
      }
    } catch (error) {
      console.error("❌ Erreur lors de la recherche:", error);
      setIsVerified(false);
      setFoundUserName("");
    }
  };

  // Auto-search when phone number is complete
  useEffect(() => {
    if (phoneInput.length >= 8) {
      const timeoutId = setTimeout(() => {
        handlePhoneSearch();
      }, 500); // Debounce for 500ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [phoneInput, selectedCountryCode]);

  return (
    <div className="form-container">
      {/* Country Selection */}
      <div className="select-field-wrapper">
        <Label htmlFor="country">Pays de Destination</Label>
        <Select
          value={recipient.country}
          onValueChange={handleCountryChange}
          required
        >
          <SelectTrigger className="h-12">
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
        {/* Fixed space for agent info */}
        <div className="min-h-[60px]">
          {userRole === 'agent' && (
            <div className="text-xs space-y-1 animate-fade-in">
              <p className="text-blue-600">
                🏢 Mode Agent: Tous les pays disponibles
              </p>
              <p className="text-gray-500">
                Pays d'origine: {userCountry}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Phone Number Input with Country Code */}
      {recipient.country && (
        <div className="form-field-wrapper">
          <PhoneInput
            phoneInput={phoneInput}
            countryCode={selectedCountryCode}
            onPhoneChange={setPhoneInput}
            isLoading={isSearching}
            isVerified={isVerified}
            label="Numéro de téléphone du destinataire"
            recipientName={foundUserName}
            onBlurComplete={handlePhoneSearch}
          />
        </div>
      )}

      {/* Manual Name Entry if user not found - Fixed space */}
      <div className="min-h-[120px]">
        {phoneInput.length >= 8 && !isVerified && !isSearching && (
          <div className="form-field-wrapper animate-fade-in">
            <Label htmlFor="fullName">Nom Complet du Bénéficiaire</Label>
            <Input
              id="fullName"
              required
              placeholder="Entrez le nom complet"
              value={recipient.fullName}
              onChange={(e) =>
                updateFields({
                  recipient: { ...recipient, fullName: e.target.value },
                })
              }
              className="h-12"
            />
            <div className="min-h-[20px] form-message-zone">
              <p className="text-sm text-amber-600">
                ⚠️ Destinataire non trouvé - Veuillez saisir le nom manuellement
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipientInfo;
