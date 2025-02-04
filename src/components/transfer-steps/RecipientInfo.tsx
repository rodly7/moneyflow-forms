import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransferData } from "../TransferForm";
import { useState, useEffect } from "react";
import { countries } from "@/data/countries";
import { Flag, Check, Phone, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type RecipientInfoProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

type UserProfile = {
  phone: string;
  full_name: string;
};

const RecipientInfo = ({ recipient, updateFields }: RecipientInfoProps) => {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const { toast } = useToast();

  // Fetch all users when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('phone, full_name')
          .not('phone', 'eq', '');

        if (error) throw error;

        console.log("Found users:", data);
        setUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger la liste des utilisateurs",
          variant: "destructive"
        });
      }
    };

    fetchUsers();
  }, [toast]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="country">Pays du bénéficiaire</Label>
        <Select
          value={recipient.country}
          onValueChange={(value) => {
            updateFields({ 
              recipient: { 
                ...recipient, 
                country: value,
                phone: '', 
                fullName: '', 
              } 
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez le pays" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.name} value={country.name}>
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4" />
                  <span>{country.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {recipient.country && (
        <div className="space-y-2">
          <Label>Numéro de téléphone</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {recipient.phone ? (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{recipient.phone}</span>
                    {recipient.fullName && (
                      <>
                        <span className="text-muted-foreground">-</span>
                        <span className="text-muted-foreground">{recipient.fullName}</span>
                      </>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">Sélectionnez un numéro</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0">
              <Command>
                <CommandInput placeholder="Rechercher un numéro..." />
                <CommandEmpty>Aucun utilisateur trouvé</CommandEmpty>
                <CommandGroup>
                  {users.map((user) => (
                    <CommandItem
                      key={user.phone}
                      value={user.phone}
                      onSelect={() => {
                        updateFields({
                          recipient: {
                            ...recipient,
                            phone: user.phone,
                            fullName: user.full_name || '',
                          }
                        });
                        setOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 shrink-0" />
                        <span>{user.phone}</span>
                        {user.full_name && (
                          <>
                            <span className="text-muted-foreground">-</span>
                            <span className="text-muted-foreground">{user.full_name}</span>
                          </>
                        )}
                      </div>
                      {recipient.phone === user.phone && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {recipient.fullName && (
        <div className="space-y-2">
          <Label htmlFor="fullName">Nom du bénéficiaire</Label>
          <Input
            id="fullName"
            value={recipient.fullName}
            readOnly
            className="bg-gray-100"
          />
        </div>
      )}
    </div>
  );
};

export default RecipientInfo;