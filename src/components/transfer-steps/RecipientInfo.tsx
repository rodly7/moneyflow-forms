
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
      // On extrait le domaine et le nom d'utilisateur
      const [username, domain] = email.split('@');
      
      // Recherche simple pour des emails similaires
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .or(`email.ilike.${username}%@${domain},email.ilike.%${username}@${domain}`)
        .limit(5);
        
      if (error || !data) {
        console.error('Erreur lors de la recherche d\'emails similaires:', error);
        return [];
      }
      
      return data.map(profile => ({
        email: profile.email || '',
        fullName: profile.full_name || '',
      }));
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
      
      // Rechercher le profil via l'adresse email exacte
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('email', email)
        .maybeSingle();

      if (userError) {
        console.error('Erreur lors de la vérification:', userError);
        toast({
          title: "Erreur",
          description: "Impossible de vérifier l'adresse email",
          variant: "destructive",
        });
        return;
      }

      if (!userData) {
        console.log("Aucun utilisateur trouvé avec cet email exact:", email);
        
        // Chercher des emails similaires
        const similarEmails = await findSimilarEmails(email);
        
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

      console.log("Bénéficiaire trouvé:", userData);
      // Mettre à jour les informations du bénéficiaire
      updateFields({
        recipient: {
          ...recipient,
          email: email,
          fullName: userData.full_name || '',
          country: recipient.country,
        }
      });

      toast({
        title: "Bénéficiaire trouvé",
        description: userData.full_name || 'Nom non disponible',
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
