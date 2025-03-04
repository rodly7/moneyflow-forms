
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
};

const PhoneInput = ({
  phoneInput,
  countryCode,
  onPhoneChange,
  isLoading,
  isVerified,
  label = "Numéro de téléphone",
  recipientName
}: PhoneInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  
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
            onChange={(e) => onPhoneChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
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
