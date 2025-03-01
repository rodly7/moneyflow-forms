
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TransferData } from "@/types/transfer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Check } from "lucide-react";

type RecipientInfoProps = {
  recipient: TransferData['recipient'];
  updateFields: (fields: Partial<TransferData>) => void;
};

type SuggestionType = {
  email: string;
  fullName: string;
  phone: string;
};

const RecipientInfo = ({ recipient, updateFields }: RecipientInfoProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionType[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast } = useToast();

  const isValidEmail = (email: string) => {
    // Basic email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Check if email starts with numbers only
    const startsWithNumbersOnly = /^[0-9]+@/;
    
    return emailRegex.test(email) && !startsWithNumbersOnly.test(email);
  };

  const isValidPhoneNumber = (input: string) => {
    // Remove spaces and '+' characters for validation
    const cleanedInput = input.replace(/[\s+]/g, '');
    // Check if the cleaned input contains only digits
    return /^\d+$/.test(cleanedInput) && cleanedInput.length >= 8;
  };

  const verifyRecipient = async (identifier: string) => {
    if (!identifier) return;
    setSuggestions([]);
    setShowSuggestions(false);

    // Check if input is an email or phone number
    const isEmail = identifier.includes('@');
    const isPhone = isValidPhoneNumber(identifier);

    if (isEmail && !isValidEmail(identifier)) {
      toast({
        title: "Format d'email invalide",
        description: "Veuillez entrer une adresse email valide",
        variant: "destructive",
      });
      // Reset recipient fields but keep the email
      updateFields({
        recipient: {
          ...recipient,
          email: identifier,
          fullName: '',
          country: recipient.country,
        }
      });
      return;
    }

    if (!isEmail && !isPhone) {
      toast({
        title: "Format invalide",
        description: "Veuillez entrer une adresse email ou un numéro de téléphone valide",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log("Vérification de l'identifiant:", identifier);
      
      // Use supabase RPC to call the find_recipient function
      const { data, error } = await supabase
        .rpc('find_recipient', { search_term: identifier });
      
      if (error) {
        console.error('Erreur lors de la vérification:', error);
        toast({
          title: "Erreur",
          description: "Une erreur s'est produite lors de la vérification",
          variant: "destructive",
        });
        return;
      }
      
      if (!data || data.length === 0) {
        console.log("Aucun utilisateur trouvé avec cet identifiant:", identifier);
        
        toast({
          title: "Destinataire introuvable",
          description: "Cet identifiant n'est pas enregistré dans le système",
          variant: "destructive",
        });
        
        // Reset recipient fields but keep the identifier
        updateFields({
          recipient: {
            ...recipient,
            email: identifier,
            fullName: '',
            country: recipient.country,
          }
        });
        return;
      }

      console.log("Bénéficiaire(s) trouvé(s):", data);
      
      // If only one result, update recipient info directly
      if (data.length === 1) {
        updateFields({
          recipient: {
            ...recipient,
            email: identifier, // Keep using what user entered for consistency
            fullName: data[0].full_name || "Nom non disponible",
            country: data[0].country || recipient.country,
          }
        });

        toast({
          title: "Bénéficiaire trouvé",
          description: data[0].full_name || "Nom non disponible",
        });
      } else {
        // Multiple matches, show suggestions
        setSuggestions(data.map(user => ({
          email: user.email,
          fullName: user.full_name || "Nom non disponible",
          phone: user.phone
        })));
        setShowSuggestions(true);
      }

    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la vérification",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectSuggestion = (suggestion: SuggestionType) => {
    updateFields({
      recipient: {
        ...recipient,
        email: suggestion.phone || suggestion.email, // Prioritize phone if available
        fullName: suggestion.fullName,
        country: recipient.country,
      }
    });
    setSuggestions([]);
    setShowSuggestions(false);
    
    toast({
      title: "Bénéficiaire sélectionné",
      description: suggestion.fullName || suggestion.phone || suggestion.email,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Numéro de téléphone ou email du bénéficiaire</Label>
        <Input
          type="text"
          placeholder="Ex: +237 6XXXXXXXX ou utilisateur@sendflow.com"
          value={recipient.email}
          onChange={(e) => {
            const value = e.target.value;
            updateFields({
              recipient: {
                ...recipient,
                email: value,
              }
            });
          }}
          onBlur={(e) => verifyRecipient(e.target.value)}
          disabled={isLoading}
        />
        
        {showSuggestions && suggestions.length > 0 && (
          <div className="mt-2 border rounded-md overflow-hidden bg-white shadow-sm">
            <div className="p-2 bg-gray-50 border-b text-sm font-medium">
              Suggestions
            </div>
            <ul className="max-h-60 overflow-auto">
              {suggestions.map((suggestion, index) => (
                <li 
                  key={index} 
                  className="p-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                  onClick={() => selectSuggestion(suggestion)}
                >
                  <div>
                    <div className="font-medium">{suggestion.fullName}</div>
                    <div className="text-sm text-gray-500">
                      {suggestion.phone || suggestion.email}
                    </div>
                  </div>
                  <div className="text-emerald-500">
                    <Check className="w-4 h-4" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

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
