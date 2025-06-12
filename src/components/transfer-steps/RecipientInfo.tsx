
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransferData } from "@/types/transfer";
import { useState, useEffect } from "react";
import { countries } from "@/data/countries";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PhoneInput from "./PhoneInput";

type RecipientInfoProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const RecipientInfo = ({ recipient, updateFields }: RecipientInfoProps) => {
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const { user, userRole } = useAuth();

  // Récupérer le profil de l'utilisateur pour connaître son pays
  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('country')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const userCountry = userProfile?.country || "Cameroun";

  // Filtrer les pays disponibles pour les agents (exclure leur pays)
  const availableCountries = userRole === 'agent' 
    ? countries.filter(country => country.name !== userCountry)
    : countries;

  useEffect(() => {
    if (recipient.country) {
      const country = countries.find(c => c.name === recipient.country);
      if (country) {
        setSelectedCountryCode(country.code);
      }
    }
  }, [recipient.country]);

  const handlePhoneVerification = async () => {
    if (!phoneInput || phoneInput.length < 6 || !recipient.country) {
      return;
    }

    setIsLoading(true);
    try {
      const fullPhone = selectedCountryCode + phoneInput.replace(/\s/g, '');
      
      const { data, error } = await supabase
        .rpc('find_recipient', { search_term: fullPhone });

      if (error) {
        console.error("Erreur lors de la recherche:", error);
        setIsVerified(false);
        return;
      }

      if (data && data.length > 0) {
        const recipientData = data[0];
        updateFields({
          recipient: {
            ...recipient,
            fullName: recipientData.full_name || '',
            email: recipientData.email || '',
            phone: fullPhone
          }
        });
        setIsVerified(true);
      } else {
        updateFields({
          recipient: {
            ...recipient,
            fullName: '',
            email: phoneInput + '@placeholder.com',
            phone: fullPhone
          }
        });
        setIsVerified(false);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification:", error);
      setIsVerified(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="country">Pays de Destination</Label>
        <Select
          value={recipient.country}
          onValueChange={(value) => {
            const country = availableCountries.find(c => c.name === value);
            if (country) {
              setSelectedCountryCode(country.code);
              updateFields({ 
                recipient: { 
                  ...recipient, 
                  country: value,
                  fullName: '',
                  email: '',
                  phone: ''
                } 
              });
              setPhoneInput("");
              setIsVerified(false);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez le pays de destination" />
          </SelectTrigger>
          <SelectContent>
            {availableCountries.map((country) => (
              <SelectItem key={country.name} value={country.name}>
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {userRole === 'agent' && (
          <p className="text-xs text-muted-foreground">
            Note: Les transferts nationaux ne sont pas autorisés pour les agents
          </p>
        )}
      </div>

      {recipient.country && (
        <PhoneInput
          phoneInput={phoneInput}
          countryCode={selectedCountryCode}
          onPhoneChange={setPhoneInput}
          isLoading={isLoading}
          isVerified={isVerified}
          label="Numéro de téléphone du bénéficiaire"
          recipientName={isVerified ? recipient.fullName : undefined}
          onBlurComplete={handlePhoneVerification}
        />
      )}

      {recipient.country && !isVerified && recipient.phone && (
        <div className="space-y-2">
          <Label htmlFor="fullName">Nom Complet du Bénéficiaire</Label>
          <Input
            id="fullName"
            type="text"
            required
            placeholder="Nom complet du destinataire"
            value={recipient.fullName}
            onChange={(e) =>
              updateFields({
                recipient: { ...recipient, fullName: e.target.value },
              })
            }
          />
        </div>
      )}
    </div>
  );
};

export default RecipientInfo;
