import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Loader2, User } from "lucide-react";
import { useUserSearch } from "@/hooks/useUserSearch";
import { countries } from "@/data/countries";

type BillPhoneInputProps = {
  phoneInput: string;
  countryCode: string;
  country: string;
  onPhoneChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onUserFound?: (user: any) => void;
  label?: string;
};

export const BillPhoneInput = ({
  phoneInput,
  countryCode,
  country,
  onPhoneChange,
  onCountryChange,
  onUserFound,
  label = "Numéro de téléphone"
}: BillPhoneInputProps) => {
  const { searchUserByPhone, isSearching } = useUserSearch();
  const [isVerified, setIsVerified] = useState(false);
  const [foundUserName, setFoundUserName] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Get country code based on selected country
  const getCountryCode = (countryName: string) => {
    const countryData = countries.find(c => c.name === countryName);
    return countryData ? countryData.code : "+237";
  };

  // Update country code when country changes
  useEffect(() => {
    if (country) {
      const newCountryCode = getCountryCode(country);
      if (newCountryCode !== countryCode) {
        // Reset phone and verification when country changes
        onPhoneChange("");
        setIsVerified(false);
        setFoundUserName("");
      }
    }
  }, [country]);

  // Check if the phone number is complete based on country code
  const isPhoneComplete = () => {
    const digits = phoneInput.replace(/\D/g, '');
    
    // For Congo Brazzaville (+242), we need at least 9 digits
    if (countryCode.includes('242')) {
      return digits.length >= 9;
    }
    
    // For other countries, default to 8 digits minimum
    return digits.length >= 8;
  };

  // Format the phone number for display
  const formatPhoneForDisplay = (phone: string): string => {
    // For Congo Brazzaville, format as XX XXX XX XX
    if (countryCode.includes('242') && phone.length > 0) {
      const digitsOnly = phone.replace(/\D/g, '');
      
      // Apply Congo Brazzaville formatting
      let formatted = '';
      for (let i = 0; i < digitsOnly.length; i++) {
        if (i === 2 || i === 5 || i === 7) {
          formatted += ' ';
        }
        formatted += digitsOnly[i];
      }
      return formatted.trim();
    }
    
    // Default format (just return cleaned input)
    return phone;
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
      const fullPhoneNumber = countryCode + phoneInput;
      console.log("🔍 Recherche de l'utilisateur pour facturation:", fullPhoneNumber);
      
      const foundUser = await searchUserByPhone(fullPhoneNumber);
      
      if (foundUser) {
        console.log("✅ Utilisateur trouvé:", foundUser);
        setIsVerified(true);
        setFoundUserName(foundUser.full_name || "Utilisateur");
        
        // Notify parent component about found user
        if (onUserFound) {
          onUserFound(foundUser);
        }
      } else {
        console.log("ℹ️ Aucun utilisateur trouvé");
        setIsVerified(false);
        setFoundUserName("");
      }
    } catch (error) {
      console.error("❌ Erreur lors de la recherche:", error);
      setIsVerified(false);
      setFoundUserName("");
    }
  };

  // Handle blur event to trigger verification when phone number is complete
  const handleBlur = () => {
    setIsFocused(false);
    if (isPhoneComplete()) {
      console.log("Numéro complet, déclenchement de la vérification");
      handlePhoneSearch();
    }
  };

  // Handle input change to format and validate
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const digitsOnly = e.target.value.replace(/\D/g, '');
    onPhoneChange(digitsOnly);
  };

  // Handle keyup to trigger verification on Enter key
  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isPhoneComplete()) {
      console.log("Touche Entrée pressée, déclenchement de la vérification");
      handlePhoneSearch();
    }
  };

  // Determine placeholder text based on country code
  const getPlaceholder = (): string => {
    if (countryCode.includes('242')) {
      return "Ex: 06 XXX XX XX";
    }
    return "Ex: XXXXXXXX";
  };

  // Auto-search when phone number is complete
  useEffect(() => {
    if (phoneInput.length >= 8) {
      const timeoutId = setTimeout(() => {
        handlePhoneSearch();
      }, 500); // Debounce for 500ms
      
      return () => clearTimeout(timeoutId);
    } else {
      setIsVerified(false);
      setFoundUserName("");
    }
  }, [phoneInput, countryCode]);

  return (
    <div className="space-y-4">
      {/* Country Selection */}
      <div className="form-field-wrapper">
        <Label htmlFor="bill-country">Pays</Label>
        <select
          id="bill-country"
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
          required
          className="h-12 w-full px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="">Sélectionnez le pays</option>
          {countries.map((countryOption) => (
            <option key={countryOption.name} value={countryOption.name}>
              {countryOption.name}
            </option>
          ))}
        </select>
      </div>

      {/* Phone Number Input */}
      {country && (
        <div className="form-field-wrapper">
          <Label>{label}</Label>
          <div className="flex items-center space-x-2">
            <div className="w-24 flex-shrink-0">
              <Input
                type="text"
                value={getCountryCode(country)}
                readOnly
                className="bg-gray-100 h-12"
              />
            </div>
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder={getPlaceholder()}
                value={formatPhoneForDisplay(phoneInput)}
                onChange={handleInputChange}
                onFocus={() => setIsFocused(true)}
                onBlur={handleBlur}
                onKeyUp={handleKeyUp}
                disabled={isSearching}
                className={`h-12 ${isVerified ? "border-green-500 focus-visible:ring-green-500 pr-10" : "pr-10"}`}
                autoComplete="tel"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              )}
              {isVerified && !isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Check className="w-4 h-4 text-green-500" />
                </div>
              )}
            </div>
          </div>
          
          {/* Compact verification status */}
          <div className="min-h-[20px] form-message-zone">
            {isVerified && foundUserName && (
              <div className="flex items-center text-sm text-green-600 animate-fade-in">
                <User className="w-3.5 h-3.5 mr-1" />
                <span>{foundUserName}</span>
              </div>
            )}
            {phoneInput.length >= 8 && !isVerified && !isSearching && (
              <div className="text-sm text-amber-600">
                ⚠️ Utilisateur non trouvé - Vérifiez le numéro
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};