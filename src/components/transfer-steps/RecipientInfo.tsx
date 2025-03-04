
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TransferData } from "@/types/transfer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Check, Loader2 } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { countries } from "@/data/countries";

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
  display_name?: string;
};

const RecipientInfo = ({ recipient, updateFields }: RecipientInfoProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionType[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recipientVerified, setRecipientVerified] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const { toast } = useToast();

  // Mettre à jour l'indicatif téléphonique lorsque le pays change
  useEffect(() => {
    if (recipient.country) {
      const selectedCountry = countries.find(c => c.name === recipient.country);
      if (selectedCountry) {
        setCountryCode(selectedCountry.code);
      }
    }
  }, [recipient.country]);

  // Mettre à jour le champ email complet (avec préfixe) lorsque l'input ou l'indicatif change
  useEffect(() => {
    if (phoneInput) {
      // Format the phone number with country code
      const formattedPhone = phoneInput.startsWith('+') ? phoneInput : `${countryCode}${phoneInput.startsWith('0') ? phoneInput.substring(1) : phoneInput}`;
      
      updateFields({
        recipient: {
          ...recipient,
          email: formattedPhone,
        }
      });

      // Reset verification status when phone number changes
      if (recipientVerified) {
        setRecipientVerified(false);
      }
    }
  }, [phoneInput, countryCode]);

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
    const isPhone = !isEmail;

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

    if (isPhone && !identifier.match(/^\+?[0-9\s]+$/)) {
      toast({
        title: "Format de téléphone invalide",
        description: "Veuillez entrer un numéro de téléphone valide",
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
            fullName: recipient.fullName || "Nouveau destinataire",
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
        
        console.log("Recherche par téléphone:", cleanedPhone);
        
        // Utiliser la fonction find_recipient pour trouver un bénéficiaire
        const { data: recipientMatch, error: recipientError } = await supabase
          .rpc('find_recipient', {
            search_term: cleanedPhone
          });
        
        if (recipientError) {
          console.error('Erreur lors de la recherche du bénéficiaire:', recipientError);
          toast({
            title: "Erreur",
            description: "Une erreur s'est produite lors de la vérification: " + recipientError.message,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        console.log("Réponse de find_recipient:", recipientMatch);
        
        if (!recipientMatch || recipientMatch.length === 0) {
          console.log("Aucun utilisateur trouvé avec ce numéro:", identifier);
          
          // Cherchons dans la table auth_users_view pour voir si le numéro correspond à un champ dans raw_user_meta_data
          const { data: authUserData, error: authUserError } = await supabase
            .from('auth_users_view')
            .select('id, email, raw_user_meta_data')
            .maybeSingle();
          
          if (authUserError) {
            console.error('Erreur lors de la recherche dans auth_users_view:', authUserError);
          }
          
          let userFound = null;
          
          if (authUserData && authUserData.raw_user_meta_data) {
            // Vérifier si le phone se trouve dans les métadonnées de l'utilisateur
            const metadata = authUserData.raw_user_meta_data as any;
            
            if (metadata.phone === cleanedPhone) {
              console.log("Utilisateur trouvé via metadata.phone:", authUserData);
              userFound = authUserData;
            }
          }
          
          if (userFound) {
            // Récupérer les informations du profil si disponibles
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name, country, phone')
              .eq('id', userFound.id)
              .maybeSingle();
              
            const metadata = userFound.raw_user_meta_data as any;
            const userName = profileData?.full_name || metadata.full_name || `Utilisateur ${cleanedPhone}`;
              
            updateFields({
              recipient: {
                ...recipient,
                email: identifier,
                fullName: userName,
                country: profileData?.country || metadata.country || recipient.country,
              }
            });
            
            setRecipientVerified(true);
            
            toast({
              title: "Bénéficiaire trouvé",
              description: userName,
            });
            
            setIsLoading(false);
            return;
          }
          
          // Permettre le transfert vers des numéros non enregistrés
          updateFields({
            recipient: {
              ...recipient,
              email: identifier,
              fullName: recipient.fullName || "Nouveau destinataire",
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
        
        console.log("Bénéficiaire(s) trouvé(s):", recipientMatch);
        
        // Si un destinataire est trouvé, l'utiliser
        if (recipientMatch.length > 0) {
          const user = recipientMatch[0];
          
          console.log("Utilisateur trouvé:", user);
          
          // Chercher si ce numéro correspond à des métadonnées dans auth_users_view
          const { data: authData } = await supabase
            .from('auth_users_view')
            .select('raw_user_meta_data')
            .eq('id', user.id)
            .maybeSingle();
            
          console.log("Données auth utilisateur:", authData);
          
          // Extraire les informations des métadonnées si disponibles
          let displayName = user.full_name;
          
          if (authData && authData.raw_user_meta_data) {
            const metadata = authData.raw_user_meta_data as any;
            if (metadata.full_name) {
              displayName = metadata.full_name;
            }
            console.log("Nom complet extrait des métadonnées:", displayName);
          }
          
          const fullNameToUse = displayName || user.full_name;
          
          updateFields({
            recipient: {
              ...recipient,
              email: user.phone, // Utiliser le téléphone comme identifiant
              fullName: fullNameToUse,
              country: user.country || recipient.country,
            }
          });
          
          setRecipientVerified(true);
          
          toast({
            title: "Bénéficiaire trouvé",
            description: fullNameToUse,
          });
          
          // Mettre à jour l'input du téléphone pour afficher le numéro complet
          setPhoneInput(user.phone.replace(countryCode, ""));
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

  const handleCountryChange = (value: string) => {
    const selectedCountry = countries.find(c => c.name === value);
    
    updateFields({
      recipient: {
        ...recipient,
        country: value,
      }
    });
    
    if (selectedCountry) {
      setCountryCode(selectedCountry.code);
    }
  };

  const handlePhoneInput = (value: string) => {
    setPhoneInput(value);
  };

  const selectSuggestion = (suggestion: SuggestionType) => {
    updateFields({
      recipient: {
        ...recipient,
        email: suggestion.phone || suggestion.email, // Priorité au téléphone si disponible
        fullName: suggestion.display_name || suggestion.full_name,
        country: suggestion.country || recipient.country,
      }
    });
    setSuggestions([]);
    setShowSuggestions(false);
    setRecipientVerified(true);
    
    // Mettre à jour l'input du téléphone pour afficher le numéro sans l'indicatif
    setPhoneInput(suggestion.phone.replace(countryCode, ""));
    
    toast({
      title: "Bénéficiaire sélectionné",
      description: suggestion.display_name || suggestion.full_name || suggestion.phone || suggestion.email,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Pays du bénéficiaire</Label>
        <Select 
          value={recipient.country} 
          onValueChange={handleCountryChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionnez un pays" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.name} value={country.name}>
                {country.name} ({country.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Numéro de téléphone du bénéficiaire</Label>
        <div className="flex items-center space-x-2">
          <div className="w-24 flex-shrink-0">
            <Input
              type="text"
              value={countryCode}
              readOnly
              className="bg-gray-100"
            />
          </div>
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Ex: 6XXXXXXXX"
              value={phoneInput}
              onChange={(e) => handlePhoneInput(e.target.value)}
              onBlur={() => recipient.email && verifyRecipient(recipient.email)}
              disabled={isLoading}
              className={recipientVerified ? "border-green-500 focus-visible:ring-green-500 pr-10" : "pr-10"}
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            )}
            {recipientVerified && !isLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Check className="w-4 h-4 text-green-500" />
              </div>
            )}
          </div>
        </div>
        
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
                    <div className="font-medium">{suggestion.display_name || suggestion.full_name}</div>
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
          onChange={(e) => {
            updateFields({
              recipient: {
                ...recipient,
                fullName: e.target.value,
              }
            });
          }}
          className={recipientVerified ? "border-green-500" : ""}
          readOnly={recipientVerified}
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
