import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransferData } from "../TransferForm";
import { countries } from "@/data/countries";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type RecipientInfoProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const RecipientInfo = ({ recipient, updateFields }: RecipientInfoProps) => {
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const verifyPhoneNumber = async (phone: string) => {
    if (!phone) return;

    try {
      setIsLoading(true);
      
      // Vérifier si l'utilisateur existe dans auth.users
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('phone', phone)
        .maybeSingle();

      if (error) {
        console.error('Error verifying phone number:', error);
        toast({
          title: "Erreur",
          description: "Impossible de vérifier le numéro de téléphone",
          variant: "destructive",
        });
        return;
      }

      if (!profile) {
        toast({
          title: "Numéro non trouvé",
          description: "Ce numéro n'est pas enregistré dans le système",
          variant: "destructive",
        });
        // Réinitialiser les champs du bénéficiaire
        updateFields({
          recipient: {
            ...recipient,
            phone: '',
            fullName: '',
          }
        });
        return;
      }

      // Mettre à jour les informations du bénéficiaire
      updateFields({
        recipient: {
          ...recipient,
          fullName: profile.full_name || '',
        }
      });

      toast({
        title: "Bénéficiaire trouvé",
        description: `${profile.full_name}`,
      });

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la vérification",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (recipient.country) {
      const country = countries.find(c => c.name === recipient.country);
      if (country) {
        setSelectedCountryCode(country.code);
      }
    }
  }, [recipient.country]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="country">Pays du Bénéficiaire</Label>
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
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {recipient.country && (
        <div className="space-y-2">
          <Label>Numéro de téléphone du bénéficiaire</Label>
          <div className="flex gap-2">
            <div className="w-24">
              <Input
                value={selectedCountryCode}
                readOnly
                className="bg-gray-100"
              />
            </div>
            <Input
              type="tel"
              placeholder="Numéro de téléphone"
              value={recipient.phone}
              onChange={(e) => {
                const phone = e.target.value;
                updateFields({
                  recipient: {
                    ...recipient,
                    phone,
                  }
                });
              }}
              onBlur={() => verifyPhoneNumber(recipient.phone)}
              disabled={isLoading}
            />
          </div>
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
          readOnly
          className="bg-gray-100"
        />
      </div>
    </div>
  );
};

export default RecipientInfo;