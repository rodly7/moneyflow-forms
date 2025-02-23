import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransferData } from "@/types/transfer";
import { useState, useEffect } from "react";
import { countries } from "@/data/countries";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type SenderInfoProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const SenderInfo = ({ recipient, updateFields }: SenderInfoProps) => {
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const { user } = useAuth();

  // Fetch user profile data
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Pre-fill recipient information when profile data is loaded
  useEffect(() => {
    if (profile) {
      updateFields({
        recipient: {
          ...recipient,
          country: profile.country || '',
        }
      });
    }
  }, [profile]);

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
        <Label htmlFor="country">Pays d'envoi</Label>
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
                } 
              });
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez votre pays" />
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

      <div className="space-y-2">
        <Label htmlFor="fullName">Nom Complet</Label>
        <Input
          id="fullName"
          type="text"
          required
          placeholder="Votre nom complet"
          value={profile?.full_name || ''}
          readOnly
          className="bg-gray-100"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Numéro de Téléphone</Label>
        <div className="flex gap-2">
          <div className="w-24">
            <Input
              value={selectedCountryCode}
              readOnly
              className="bg-gray-100"
            />
          </div>
          <Input
            id="phone"
            type="tel"
            required
            placeholder="XX XXX XXXX"
            value={profile?.phone || ''}
            readOnly
            className="bg-gray-100"
          />
        </div>
      </div>
    </div>
  );
};

export default SenderInfo;
