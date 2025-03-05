
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Loader2, User } from "lucide-react";

type PhoneInputProps = {
  phoneInput: string;
  countryCode: string;
  onPhoneChange: (value: string) => void;
  isLoading: boolean;
  isVerified: boolean;
  label?: string;
  recipientName?: string;
  onBlurComplete?: () => void;
};

const PhoneInput = ({
  phoneInput,
  countryCode,
  onPhoneChange,
  isLoading,
  isVerified,
  label = "Numéro de téléphone",
  recipientName,
  onBlurComplete
}: PhoneInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  
  // Check if the phone number is complete (more than 8 digits)
  const isPhoneComplete = phoneInput.replace(/\D/g, '').length >= 8;
  
  // Handle blur event to trigger verification when phone number is complete
  const handleBlur = () => {
    setIsFocused(false);
    if (isPhoneComplete && onBlurComplete) {
      onBlurComplete();
    }
  };

  // Handle input change to only allow numeric values
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const value = e.target.value.replace(/\D/g, '');
    onPhoneChange(value);
  };
  
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center space-x-2">
        <div className="w-24 flex-shrink-0">
          <Input
            type="text"
            value={countryCode}
            readOnly
            className="bg-gray-100"
          />
        </div>
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Ex: 6XXXXXXXX"
            value={phoneInput}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            disabled={isLoading}
            className={isVerified ? "border-green-500 focus-visible:ring-green-500 pr-10" : "pr-10"}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          )}
          {isVerified && !isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Check className="w-4 h-4 text-green-500" />
            </div>
          )}
        </div>
      </div>
      
      {isVerified && recipientName && (
        <div className="flex items-center text-sm text-green-600 mt-1">
          <User className="w-3.5 h-3.5 mr-1" />
          <span>{recipientName}</span>
        </div>
      )}
    </div>
  );
};

export default PhoneInput;
