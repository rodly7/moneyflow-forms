
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

  // Fonction pour extraire le nom à partir des métadonnées utilisateur
  const extractNameFromMetadata = (metadata: any): string | null => {
    if (!metadata) return null;
    
    // Liste des clés possibles pour le nom d'utilisateur dans les métadonnées
    const possibleNameKeys = [
      'display_name', 'displayName', 'full_name', 'fullName', 
      'name', 'user_name', 'userName', 'first_name', 'firstName',
      'nom', 'prenom', 'prénom', 'pseudo'
    ];
    
    // Vérifier chaque clé possible
    for (const key of possibleNameKeys) {
      if (metadata[key] && typeof metadata[key] === 'string' && metadata[key].trim().length > 0) {
        return metadata[key].trim();
      }
    }
    
    // Essayer de construire un nom à partir des parties (prénom + nom)
    if (metadata.first_name && metadata.last_name) {
      return `${metadata.first_name} ${metadata.last_name}`.trim();
    }
    
    if (metadata.firstName && metadata.lastName) {
      return `${metadata.firstName} ${metadata.lastName}`.trim();
    }
    
    if (metadata.prenom && metadata.nom) {
      return `${metadata.prenom} ${metadata.nom}`.trim();
    }
    
    if (metadata.prénom && metadata.nom) {
      return `${metadata.prénom} ${metadata.nom}`.trim();
    }
    
    return null;
  };

  // Fonction pour normaliser un numéro de téléphone pour la comparaison
  const normalizePhoneNumber = (phone: string): string => {
    return phone.replace(/[\s+()-]/g, '');
  };

  // Fonction pour comparer deux numéros de téléphone normalisés
  const phoneNumbersMatch = (phone1: string, phone2: string, countryCode?: string): boolean => {
    const normalizedPhone1 = normalizePhoneNumber(phone1);
    const normalizedPhone2 = normalizePhoneNumber(phone2);
    
    // Correspondance directe
    if (normalizedPhone1 === normalizedPhone2) return true;
    
    // Vérifier si un numéro est une sous-chaîne de l'autre (pour gérer le cas où l'indicatif est présent dans un numéro mais pas dans l'autre)
    if (normalizedPhone1.endsWith(normalizedPhone2) || normalizedPhone2.endsWith(normalizedPhone1)) return true;
    
    // Si nous avons un code pays, vérifier si un numéro contient le code pays et l'autre non
    if (countryCode) {
      const normalizedCountryCode = normalizePhoneNumber(countryCode);
      
      // Si le premier numéro commence par le code pays, vérifier si le reste correspond au deuxième numéro
      if (normalizedPhone1.startsWith(normalizedCountryCode)) {
        const phone1WithoutCode = normalizedPhone1.substring(normalizedCountryCode.length);
        if (phone1WithoutCode === normalizedPhone2) return true;
      }
      
      // Vérification inverse (deuxième numéro avec code pays, premier sans)
      if (normalizedPhone2.startsWith(normalizedCountryCode)) {
        const phone2WithoutCode = normalizedPhone2.substring(normalizedCountryCode.length);
        if (phone2WithoutCode === normalizedPhone1) return true;
      }
    }
    
    return false;
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
        // Pour les numéros de téléphone, rechercher directement dans la table auth.users
        const cleanedPhone = identifier.replace(/[\s]/g, '');
        const normalizedPhone = normalizePhoneNumber(cleanedPhone);
        
        console.log("Recherche par téléphone:", cleanedPhone);
        
        // 1. Récupérer tous les utilisateurs depuis auth_users_view
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
        
        console.log("Nombre d'utilisateurs trouvés:", authUserData?.length);
        
        // 2. Recherche approfondie à travers les métadonnées des utilisateurs
        if (authUserData && authUserData.length > 0) {
          for (const user of authUserData) {
            if (user.raw_user_meta_data) {
              const metadata = user.raw_user_meta_data as any;
              console.log("Vérification des métadonnées pour l'utilisateur:", user.id);
              
              // Recherche de numéro de téléphone dans différents champs des métadonnées
              const possiblePhoneKeys = [
                'phone', 'phone_number', 'phoneNumber', 'mobile', 'tel', 
                'telephone', 'cellphone', 'cell', 'gsm', 'numero', 'téléphone'
              ];
              
              let foundPhoneMatch = false;
              
              // Vérifier chaque clé possible pour le téléphone
              for (const key of possiblePhoneKeys) {
                if (metadata[key]) {
                  const userPhone = String(metadata[key]);
                  console.log(`Comparaison: "${userPhone}" vs "${cleanedPhone}"`);
                  
                  if (phoneNumbersMatch(userPhone, cleanedPhone, countryCode)) {
                    console.log(`✓ Correspondance trouvée avec la clé "${key}": ${userPhone}`);
                    foundPhoneMatch = true;
                    break;
                  }
                }
              }
              
              // Si un téléphone correspondant est trouvé, extraire le nom
              if (foundPhoneMatch) {
                console.log("Correspondance de téléphone trouvée, extraction du nom...");
                
                // Extraire le nom des métadonnées
                const displayName = extractNameFromMetadata(metadata);
                
                if (displayName) {
                  console.log("Nom trouvé dans les métadonnées:", displayName);
                  
                  // Récupérer les informations complémentaires du profil
                  const { data: profileData } = await supabase
                    .from('profiles')
                    .select('full_name, country, phone')
                    .eq('id', user.id)
                    .maybeSingle();
                  
                  console.log("Données du profil:", profileData);
                  
                  // Créer les données du destinataire avec les informations trouvées
                  const finalResult = {
                    verified: true,
                    recipientData: {
                      email: cleanedPhone,
                      fullName: displayName || profileData?.full_name || `Utilisateur ${cleanedPhone}`,
                      country: profileData?.country || metadata.country || recipient.country,
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
            }
          }
        }
        
        // 3. Si aucune correspondance n'est trouvée dans les métadonnées,
        // vérifier directement dans la table profiles
        console.log("Recherche dans la table profiles");
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, country, phone')
          .order('created_at', { ascending: false });
        
        if (profilesError) {
          console.error('Erreur lors de la recherche dans profiles:', profilesError);
        } else if (profilesData && profilesData.length > 0) {
          console.log("Nombre de profils trouvés:", profilesData.length);
          
          // Parcourir les profils pour trouver une correspondance téléphonique
          for (const profile of profilesData) {
            if (profile.phone) {
              console.log(`Comparaison profil: "${profile.phone}" vs "${cleanedPhone}"`);
              
              if (phoneNumbersMatch(profile.phone, cleanedPhone, countryCode)) {
                console.log("✓ Correspondance trouvée dans profiles:", profile.phone);
                
                const finalResult = {
                  verified: true,
                  recipientData: {
                    email: cleanedPhone,
                    fullName: profile.full_name || `Utilisateur ${profile.phone}`,
                    country: profile.country || recipient.country,
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
          }
        }
        
        // 4. Si aucun utilisateur n'est trouvé, permettre le transfert vers un numéro non enregistré
        console.log("Aucun utilisateur trouvé avec ce numéro:", cleanedPhone);
        
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
