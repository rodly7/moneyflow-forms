
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type RecipientData = {
  email: string;
  fullName: string;
  country: string;
};

export const useRecipientVerification = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [recipientVerified, setRecipientVerified] = useState(false);
  const { toast } = useToast();

  // Vérifie si un email est valide
  const isValidEmail = (email: string) => {
    // Basic email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Check if email starts with numbers only
    const startsWithNumbersOnly = /^[0-9]+@/;
    
    return emailRegex.test(email) && !startsWithNumbersOnly.test(email);
  };

  // Vérifie si un numéro de téléphone est valide
  const isValidPhoneNumber = (input: string) => {
    // Remove spaces and '+' characters for validation
    const cleanedInput = input.replace(/[\s+]/g, '');
    // Check if the cleaned input contains only digits
    return /^\d+$/.test(cleanedInput) && cleanedInput.length >= 8;
  };

  // Fonction principale pour vérifier un destinataire par téléphone ou email
  const verifyRecipient = async (identifier: string, countryCode: string, recipient: RecipientData): Promise<{
    verified: boolean;
    recipientData?: RecipientData;
  }> => {
    if (!identifier) return { verified: false };
    
    setRecipientVerified(false);
    setIsLoading(true);

    // Check if input is an email or phone number
    const isEmail = identifier.includes('@');
    const isPhone = !isEmail;

    try {
      if (isEmail && !isValidEmail(identifier)) {
        toast({
          title: "Format d'email invalide",
          description: "Veuillez entrer une adresse email valide",
          variant: "destructive",
        });
        return { verified: false };
      }

      if (isPhone && !identifier.match(/^\+?[0-9\s]+$/)) {
        toast({
          title: "Format de téléphone invalide",
          description: "Veuillez entrer un numéro de téléphone valide",
          variant: "destructive",
        });
        return { verified: false };
      }

      console.log("Vérification de l'identifiant:", identifier);
      
      if (isEmail) {
        // Pour les emails : créer un transfert en attente s'ils n'existent pas
        toast({
          title: "Email enregistré",
          description: "Ce destinataire recevra un code pour réclamer le transfert",
        });
        
        return { 
          verified: false,
          recipientData: {
            email: identifier,
            fullName: recipient.fullName || "Nouveau destinataire",
            country: recipient.country
          }
        };
      } else {
        // Pour les numéros de téléphone, rechercher dans la table auth_users_view
        const cleanedPhone = identifier.replace(/[\s]/g, '');
        
        console.log("Recherche par téléphone:", cleanedPhone);
        
        // 1. D'abord essayer de trouver l'utilisateur via auth_users_view
        const { data: authUserData, error: authUserError } = await supabase
          .from('auth_users_view')
          .select('id, email, raw_user_meta_data')
          .order('created_at', { ascending: false });
        
        if (authUserError) {
          console.error('Erreur lors de la recherche dans auth_users_view:', authUserError);
          toast({
            title: "Erreur",
            description: "Une erreur s'est produite lors de la vérification: " + authUserError.message,
            variant: "destructive",
          });
          return { verified: false };
        }
        
        console.log("Données des utilisateurs:", authUserData);
        
        // Chercher un utilisateur dont le numéro de téléphone correspond
        let userFound = null;
        
        if (authUserData && authUserData.length > 0) {
          // Parcourir tous les utilisateurs pour chercher une correspondance de téléphone dans les métadonnées
          for (const user of authUserData) {
            if (user.raw_user_meta_data) {
              const metadata = user.raw_user_meta_data as any;
              
              // Vérifier si le phone dans les métadonnées correspond
              const userPhone = metadata.phone || metadata.phone_number || metadata.phoneNumber || metadata.mobile || metadata.tel;
              
              // Normaliser les numéros pour la comparaison
              const normalizedUserPhone = userPhone ? userPhone.replace(/[\s+]/g, '') : '';
              const normalizedCleanedPhone = cleanedPhone.replace(/[\s+]/g, '');
              
              // Vérifier si le numéro complet correspond
              if (normalizedUserPhone === normalizedCleanedPhone) {
                console.log("Utilisateur trouvé avec numéro exact:", user);
                userFound = {
                  id: user.id,
                  email: user.email,
                  metadata: metadata
                };
                break;
              }
              
              // Vérifier si le numéro sans l'indicatif correspond
              if (countryCode && normalizedCleanedPhone.startsWith(countryCode.replace(/[\s+]/g, ''))) {
                const phoneWithoutCode = normalizedCleanedPhone.substring(countryCode.replace(/[\s+]/g, '').length);
                if (normalizedUserPhone.endsWith(phoneWithoutCode)) {
                  console.log("Utilisateur trouvé avec numéro sans indicatif:", user);
                  userFound = {
                    id: user.id,
                    email: user.email,
                    metadata: metadata
                  };
                  break;
                }
              }
            }
          }
        }
        
        if (userFound) {
          // Utiliser le téléphone comme nom d'affichage si spécifié
          const userData = userFound.metadata;
          const displayName = userData.display_name || userData.displayName || userData.full_name || userData.fullName || userData.name;
          
          if (displayName) {
            console.log("Nom d'affichage trouvé:", displayName);
            
            // 2. Récupérer les informations du profil si disponibles
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name, country, phone')
              .eq('id', userFound.id)
              .maybeSingle();
              
            console.log("Données du profil:", profileData);
            
            const finalResult = {
              verified: true,
              recipientData: {
                email: cleanedPhone,
                fullName: displayName || profileData?.full_name || `Utilisateur ${cleanedPhone}`,
                country: profileData?.country || userData.country || recipient.country,
              }
            };
            
            toast({
              title: "Bénéficiaire trouvé",
              description: finalResult.recipientData.fullName,
            });
            
            setRecipientVerified(true);
            return finalResult;
          }
        }
        
        // 3. Si aucun utilisateur n'est trouvé, utiliser la fonction find_recipient
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
          return { verified: false };
        }
        
        console.log("Réponse de find_recipient:", recipientMatch);
        
        if (!recipientMatch || recipientMatch.length === 0) {
          console.log("Aucun utilisateur trouvé avec ce numéro:", cleanedPhone);
          
          // Permettre le transfert vers des numéros non enregistrés
          const noUserResult = {
            verified: false,
            recipientData: {
              email: cleanedPhone,
              fullName: cleanedPhone, // Utiliser le numéro de téléphone comme nom
              country: recipient.country,
            }
          };
          
          toast({
            title: "Numéro enregistré",
            description: "Ce destinataire recevra un code pour réclamer le transfert",
          });
          
          return noUserResult;
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
          let displayName = user.phone; // Par défaut, utiliser le numéro comme nom
          
          if (authData && authData.raw_user_meta_data) {
            const metadata = authData.raw_user_meta_data as any;
            displayName = metadata.display_name || metadata.displayName || metadata.full_name || metadata.fullName || metadata.name || user.full_name || user.phone;
          }
          
          const fullNameToUse = displayName || user.full_name || user.phone;
          
          const foundUserResult = {
            verified: true,
            recipientData: {
              email: user.phone, // Utiliser le téléphone comme identifiant
              fullName: fullNameToUse,
              country: user.country || recipient.country,
            }
          };
          
          toast({
            title: "Bénéficiaire trouvé",
            description: fullNameToUse,
          });
          
          setRecipientVerified(true);
          return foundUserResult;
        }
      }
      
      return { verified: false };
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la vérification",
        variant: "destructive",
      });
      return { verified: false };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    recipientVerified,
    verifyRecipient,
    isValidEmail,
    isValidPhoneNumber,
    setRecipientVerified
  };
};
