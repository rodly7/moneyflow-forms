import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransferData } from "../TransferForm";
import { countries } from "@/data/countries";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type RecipientInfoProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

type UserProfile = {
  phone: string;
  full_name: string | null;
};

const RecipientInfo = ({ recipient, updateFields }: RecipientInfoProps) => {
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [open, setOpen] = useState(false);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { session, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching profiles for country:", recipient.country);
        
        if (!session?.user) {
          console.error("No authenticated session found");
          toast({
            title: "Erreur d'authentification",
            description: "Veuillez vous reconnecter",
            variant: "destructive",
          });
          return;
        }

        // Fetch all profiles except the current user's for the selected country
        const { data, error } = await supabase
          .from('profiles')
          .select('phone, full_name')
          .not('id', 'eq', session.user.id)
          .eq('country', recipient.country)
          .not('phone', 'eq', '');

        if (error) {
          console.error('Error fetching profiles:', error);
          toast({
            title: "Erreur",
            description: "Impossible de charger la liste des bénéficiaires",
            variant: "destructive",
          });
          return;
        }

        console.log("Found profiles:", data);
        
        if (!data || data.length === 0) {
          toast({
            title: "Aucun bénéficiaire trouvé",
            description: `Aucun utilisateur trouvé dans ${recipient.country}`,
          });
        }
        
        setProfiles(data || []);
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Erreur",
          description: "Une erreur s'est produite lors de la récupération des bénéficiaires",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (recipient.country) {
      fetchProfiles();
    }
  }, [session, recipient.country, toast]);

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
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {recipient.phone
                  ? profiles.find((profile) => profile.phone === recipient.phone)?.phone || recipient.phone
                  : "Sélectionnez un numéro..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Rechercher un numéro..." />
                <CommandEmpty>Aucun numéro trouvé dans ce pays.</CommandEmpty>
                <CommandGroup>
                  {isLoading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Chargement...
                    </div>
                  ) : (
                    profiles.map((profile) => (
                      <CommandItem
                        key={profile.phone}
                        value={profile.phone}
                        onSelect={(currentValue) => {
                          updateFields({
                            recipient: {
                              ...recipient,
                              phone: currentValue,
                              fullName: profile.full_name || '',
                            }
                          });
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            recipient.phone === profile.phone ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {profile.phone} {profile.full_name ? `- ${profile.full_name}` : ''}
                      </CommandItem>
                    ))
                  )}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
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
          onChange={(e) =>
            updateFields({
              recipient: { ...recipient, fullName: e.target.value },
            })
          }
        />
      </div>
    </div>
  );
};

export default RecipientInfo;