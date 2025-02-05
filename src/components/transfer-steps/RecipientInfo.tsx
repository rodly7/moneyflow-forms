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
import { useToast } from "@/components/ui/use-toast";

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
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        if (!session) {
          toast({
            title: "Erreur d'authentification",
            description: "Veuillez vous reconnecter",
            variant: "destructive",
          });
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('phone, full_name')
          .not('phone', 'eq', '')
          .neq('id', session.user.id); // Exclure l'utilisateur actuel

        if (error) {
          console.error('Error fetching users:', error);
          toast({
            title: "Erreur",
            description: "Impossible de charger la liste des utilisateurs",
            variant: "destructive",
          });
          return;
        }

        console.log("Found users:", data);
        setUsers(data || []);
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Erreur",
          description: "Une erreur s'est produite",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [session, toast]);

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
                  ? users.find((user) => user.phone === recipient.phone)?.phone || recipient.phone
                  : "Sélectionnez un numéro..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Rechercher un numéro..." />
                <CommandEmpty>Aucun numéro trouvé.</CommandEmpty>
                <CommandGroup>
                  {isLoading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Chargement...
                    </div>
                  ) : (
                    users.map((user) => (
                      <CommandItem
                        key={user.phone}
                        value={user.phone}
                        onSelect={(currentValue) => {
                          updateFields({
                            recipient: {
                              ...recipient,
                              phone: currentValue,
                              fullName: user.full_name || '',
                            }
                          });
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            recipient.phone === user.phone ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {user.phone} {user.full_name ? `- ${user.full_name}` : ''}
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