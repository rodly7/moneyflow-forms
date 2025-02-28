
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
};

const RecipientInfo = ({ recipient, updateFields }: RecipientInfoProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionType[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast } = useToast();

  const isValidEmail = (email: string) => {
    // Regex basique pour la validation d'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Vérifie si l'email commence par des chiffres uniquement
    const startsWithNumbersOnly = /^[0-9]+@/;
    
    return emailRegex.test(email) && !startsWithNumbersOnly.test(email);
  };

  const findSimilarEmails = async (email: string) => {
    if (!email || !email.includes('@')) return [];
    
    try {
      // Query auth.users table through a join with profiles
      // Since we can't directly query auth schema with the client,
      // we'll need to use a simpler approach for now
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .limit(5);
        
      if (error || !data) {
        console.error('Erreur lors de la recherche d\'emails similaires:', error);
        return [];
      }
      
      // This is a simplified approach since we can't directly query auth.users
      // In a real implementation, you'd use a server-side function or RPC
      return [];
    } catch (error) {
      console.error('Erreur lors de la recherche de suggestions:', error);
      return [];
    }
  };

  const verifyEmail = async (email: string) => {
    if (!email) return;
    setSuggestions([]);
    setShowSuggestions(false);

    if (!isValidEmail(email)) {
      toast({
        title: "Format d'email invalide",
        description: "Veuillez entrer une adresse email valide",
        variant: "destructive",
      });
      // Réinitialiser les champs du bénéficiaire mais garder l'email
      updateFields({
        recipient: {
          ...recipient,
          email: email,
          fullName: '',
          country: recipient.country,
        }
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log("Vérification de l'email:", email);
      
      // Instead of directly querying for email (which doesn't exist in profiles),
      // we need to use a different approach
      
      // For demonstration purposes, we'll use a simplified approach
      // In a real implementation, you would use a server-side function or RPC
      // to securely query the auth.users table alongside profiles
      
      // Mock the result for now
      const userData = null;
      
      if (!userData) {
        console.log("Aucun utilisateur trouvé avec cet email exact:", email);
        
        // Find similar emails - this is simplified now
        const similarEmails: SuggestionType[] = [];
        
        if (similarEmails.length > 0) {
          console.log("Emails similaires trouvés:", similarEmails);
          setSuggestions(similarEmails);
          setShowSuggestions(true);
          
          toast({
            title: "Email non trouvé",
            description: "Voulez-vous dire l'un de ces destinataires ?",
            variant: "default",
          });
        } else {
          toast({
            title: "Email non trouvé",
            description: "Cette adresse email n'est pas enregistrée dans le système",
            variant: "destructive",
          });
        }
        
        // Réinitialiser les champs du bénéficiaire mais garder l'email
        updateFields({
          recipient: {
            ...recipient,
            email: email,
            fullName: '',
            country: recipient.country,
          }
        });
        return;
      }

      // This part would be updated with real data if we had access to the auth.users table
      updateFields({
        recipient: {
          ...recipient,
          email: email,
          fullName: 'Nom non disponible', // Since we can't get it currently
          country: recipient.country,
        }
      });

      toast({
        title: "Bénéficiaire trouvé",
        description: 'Nom non disponible',
      });

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
        email: suggestion.email,
        fullName: suggestion.fullName,
        country: recipient.country,
      }
    });
    setSuggestions([]);
    setShowSuggestions(false);
    
    toast({
      title: "Bénéficiaire sélectionné",
      description: suggestion.fullName || suggestion.email,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Email du bénéficiaire</Label>
        <Input
          type="email"
          placeholder="Ex: utilisateur@sendflow.com"
          value={recipient.email}
          onChange={(e) => {
            const email = e.target.value;
            updateFields({
              recipient: {
                ...recipient,
                email,
              }
            });
          }}
          onBlur={(e) => verifyEmail(e.target.value)}
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
                    <div className="text-sm text-gray-500">{suggestion.email}</div>
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
