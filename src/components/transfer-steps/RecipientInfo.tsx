
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
  id: string;
  full_name: string;
  email: string;
  phone: string;
  country: string;
};

const RecipientInfo = ({ recipient, updateFields }: RecipientInfoProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionType[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recipientVerified, setRecipientVerified] = useState(false);
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
    setRecipientVerified(false);

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
      
      if (isEmail) {
        // Pour les emails : créer un transfert en attente s'ils n'existent pas
        updateFields({
          recipient: {
            ...recipient,
            email: identifier,
            fullName: "Nouveau destinataire",
            country: recipient.country,
          }
        });
        
        toast({
          title: "Email enregistré",
          description: "Ce destinataire recevra un code pour réclamer le transfert",
        });
        
        setIsLoading(false);
        return;
      } else {
        // Pour les numéros de téléphone, rechercher dans la table profiles
        const cleanedPhone = identifier.replace(/[\s]/g, '');
        
        // Essayer plusieurs patterns de recherche pour le téléphone
        const { data: phoneMatches, error: phoneError } = await supabase
          .from('profiles')
          .select('id, full_name, phone, country')
          .or(`phone.ilike.%${cleanedPhone}%,phone.ilike.%${cleanedPhone.replace('+', '')}%`);
        
        if (phoneError) {
          console.error('Erreur lors de la recherche par téléphone:', phoneError);
          toast({
            title: "Erreur",
            description: "Une erreur s'est produite lors de la vérification",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        if (!phoneMatches || phoneMatches.length === 0) {
          console.log("Aucun utilisateur trouvé avec ce numéro:", identifier);
          
          // Permettre le transfert vers des numéros non enregistrés
          updateFields({
            recipient: {
              ...recipient,
              email: identifier,
              fullName: "Nouveau destinataire",
              country: recipient.country,
            }
          });
          
          toast({
            title: "Numéro enregistré",
            description: "Ce destinataire recevra un code pour réclamer le transfert",
          });
          
          setIsLoading(false);
          return;
        }
        
        console.log("Bénéficiaire(s) trouvé(s) par téléphone:", phoneMatches);
        
        // Formater les résultats
        const formattedMatches: SuggestionType[] = phoneMatches.map(user => ({
          id: user.id,
          full_name: user.full_name || "Utilisateur",
          email: "",
          phone: user.phone,
          country: user.country || "",
        }));
        
        // Si un seul destinataire trouvé, le sélectionner automatiquement
        if (formattedMatches.length === 1) {
          const user = formattedMatches[0];
          updateFields({
            recipient: {
              ...recipient,
              email: user.phone, // Utiliser le téléphone comme identifiant
              fullName: user.full_name,
              country: user.country || recipient.country,
            }
          });
          
          setRecipientVerified(true);
          
          toast({
            title: "Bénéficiaire trouvé",
            description: user.full_name,
          });
        } else {
          // Plusieurs correspondances, afficher les suggestions
          setSuggestions(formattedMatches);
          setShowSuggestions(true);
        }
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
        email: suggestion.phone || suggestion.email, // Priorité au téléphone si disponible
        fullName: suggestion.full_name,
        country: suggestion.country || recipient.country,
      }
    });
    setSuggestions([]);
    setShowSuggestions(false);
    setRecipientVerified(true);
    
    toast({
      title: "Bénéficiaire sélectionné",
      description: suggestion.full_name || suggestion.phone || suggestion.email,
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
            if (recipientVerified) {
              setRecipientVerified(false);
            }
          }}
          onBlur={(e) => verifyRecipient(e.target.value)}
          disabled={isLoading}
          className={recipientVerified ? "border-green-500 focus-visible:ring-green-500" : ""}
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
                    <div className="font-medium">{suggestion.full_name}</div>
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
          readOnly={true}
          className={recipientVerified ? "bg-gray-100 border-green-500" : "bg-gray-100"}
        />
        {recipientVerified && (
          <p className="text-xs text-green-600 mt-1">
            Le bénéficiaire a été vérifié et recevra directement l'argent sur son compte
          </p>
        )}
        {!recipientVerified && recipient.fullName === "Nouveau destinataire" && (
          <p className="text-xs text-amber-600 mt-1">
            Ce destinataire n'est pas encore enregistré dans le système. Il recevra un code pour réclamer le transfert.
          </p>
        )}
      </div>
    </div>
  );
};

export default RecipientInfo;
