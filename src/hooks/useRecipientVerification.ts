
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type RecipientData = {
  email: string;
  fullName: string;
  country: string;
  userId?: string;
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
    // Remove all non-digit characters
    return phone.replace(/\D/g, '');
  };
  
  // Fonction pour extraire les derniers X chiffres d'un numéro de téléphone
  const getLastDigits = (phone: string, count: number): string => {
    const normalized = normalizePhoneNumber(phone);
    return normalized.slice(-count);
  };

  // Fonction pour formater un numéro avec l'indicatif pays
  const formatWithCountryCode = (phone: string, countryCode: string): string => {
    const normalizedPhone = normalizePhoneNumber(phone);
    const normalizedCountryCode = normalizePhoneNumber(countryCode);
    
    // Si le numéro commence déjà par l'indicatif, le retourner tel quel
    if (normalizedPhone.startsWith(normalizedCountryCode)) {
      return normalizedPhone;
    }
    
    // Si le numéro commence par un 0, le supprimer
    if (normalizedPhone.startsWith('0')) {
      return normalizedCountryCode + normalizedPhone.substring(1);
    }
    
    // Sinon, simplement concaténer
    return normalizedCountryCode + normalizedPhone;
  };

  // Fonction pour comparer deux numéros de téléphone normalisés
  const phoneNumbersMatch = (phone1: string, phone2: string, countryCode?: string): boolean => {
    const normalizedPhone1 = normalizePhoneNumber(phone1);
    const normalizedPhone2 = normalizePhoneNumber(phone2);
    
    console.log(`Comparing phones: "${normalizedPhone1}" vs "${normalizedPhone2}"`);
    
    // Correspondance directe
    if (normalizedPhone1 === normalizedPhone2) {
      console.log("✓ Direct match");
      return true;
    }
    
    // Comparer les derniers 9 chiffres (efficace pour les numéros avec indicatifs différents)
    const last9digits1 = getLastDigits(normalizedPhone1, 9);
    const last9digits2 = getLastDigits(normalizedPhone2, 9);
    
    if (last9digits1.length === 9 && last9digits2.length === 9 && last9digits1 === last9digits2) {
      console.log(`✓ Last 9 digits match: ${last9digits1} vs ${last9digits2}`);
      return true;
    }
    
    // Comparer les derniers 8 chiffres
    const last8digits1 = getLastDigits(normalizedPhone1, 8);
    const last8digits2 = getLastDigits(normalizedPhone2, 8);
    
    if (last8digits1.length === 8 && last8digits2.length === 8 && last8digits1 === last8digits2) {
      console.log(`✓ Last 8 digits match: ${last8digits1} vs ${last8digits2}`);
      return true;
    }
    
    // Vérification spécifique pour Congo Brazzaville (+242)
    if (countryCode?.includes('242')) {
      // Pour le Congo, nous comparons les numéros sans les préfixes variables (0 ou 242)
      const congoFormat = (num: string): string => {
        // Enlever le code pays s'il existe
        let formatted = num.replace(/^242/, '').replace(/^\+242/, '');
        // Enlever le 0 initial s'il existe
        formatted = formatted.replace(/^0/, '');
        return formatted;
      };
      
      const congoPhone1 = congoFormat(normalizedPhone1);
      const congoPhone2 = congoFormat(normalizedPhone2);
      
      console.log(`Congo special format: "${congoPhone1}" vs "${congoPhone2}"`);
      
      if (congoPhone1 === congoPhone2) {
        console.log("✓ Congo format match");
        return true;
      }
      
      // Vérifier si un des numéros est inclus dans l'autre
      if ((congoPhone1.length > 0 && congoPhone2.length > 0) && 
          (congoPhone1.includes(congoPhone2) || congoPhone2.includes(congoPhone1))) {
        console.log("✓ Congo number is substring of the other");
        return true;
      }
    }
    
    // Vérifier si un numéro est une sous-chaîne de l'autre
    if ((normalizedPhone1.length > 0 && normalizedPhone2.length > 0) &&
        (normalizedPhone1.endsWith(normalizedPhone2) || normalizedPhone2.endsWith(normalizedPhone1))) {
      console.log("✓ Substring match (one ends with the other)");
      return true;
    }
    
    // Si nous avons un code pays, vérifier les cas où un numéro contient le code pays et l'autre non
    if (countryCode) {
      const normalizedCountryCode = normalizePhoneNumber(countryCode);
      
      // Si le premier numéro commence par le code pays, vérifier si le reste correspond au deuxième numéro
      if (normalizedPhone1.startsWith(normalizedCountryCode)) {
        const phone1WithoutCode = normalizedPhone1.substring(normalizedCountryCode.length);
        console.log(`Without code comparison: "${phone1WithoutCode}" vs "${normalizedPhone2}"`);
        
        if (phone1WithoutCode === normalizedPhone2) {
          console.log("✓ Match after removing country code from phone1");
          return true;
        }
        
        // Gérer le cas où le deuxième numéro commence par 0 et le premier sans 0
        if (normalizedPhone2.startsWith('0') && 
            phone1WithoutCode === normalizedPhone2.substring(1)) {
          console.log("✓ Match after removing country code from phone1 and leading 0 from phone2");
          return true;
        }
        
        // Vérifier si les derniers chiffres correspondent
        if ((phone1WithoutCode.length > 0 && normalizedPhone2.length > 0) &&
            (phone1WithoutCode.endsWith(normalizedPhone2) || normalizedPhone2.endsWith(phone1WithoutCode))) {
          console.log("✓ Partial match after removing country code");
          return true;
        }
      }
      
      // Vérification inverse (deuxième numéro avec code pays, premier sans)
      if (normalizedPhone2.startsWith(normalizedCountryCode)) {
        const phone2WithoutCode = normalizedPhone2.substring(normalizedCountryCode.length);
        console.log(`Without code comparison (reverse): "${normalizedPhone1}" vs "${phone2WithoutCode}"`);
        
        if (phone2WithoutCode === normalizedPhone1) {
          console.log("✓ Match after removing country code from phone2");
          return true;
        }
        
        // Gérer le cas où le premier numéro commence par 0 et le deuxième sans 0
        if (normalizedPhone1.startsWith('0') && 
            phone2WithoutCode === normalizedPhone1.substring(1)) {
          console.log("✓ Match after removing country code from phone2 and leading 0 from phone1");
          return true;
        }
        
        // Vérifier si les derniers chiffres correspondent
        if ((phone2WithoutCode.length > 0 && normalizedPhone1.length > 0) &&
            (phone2WithoutCode.endsWith(normalizedPhone1) || normalizedPhone1.endsWith(phone2WithoutCode))) {
          console.log("✓ Partial match after removing country code (reverse)");
          return true;
        }
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
        const formattedPhone = formatWithCountryCode(cleanedPhone, countryCode);
        
        console.log("Recherche par téléphone:", cleanedPhone);
        console.log("Téléphone formaté avec indicatif:", formattedPhone);
        console.log("Indicatif pays utilisé:", countryCode);
        
        // IMPROVED USER VERIFICATION - Strategy 1: Check profiles table directly first
        // This is often more reliable than checking auth_users_view
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, country, phone')
          .order('created_at', { ascending: false });
        
        if (!profilesError && profilesData && profilesData.length > 0) {
          console.log("Nombre de profils trouvés dans la table profiles:", profilesData.length);
          
          // Parcourir les profils pour trouver une correspondance téléphonique
          for (const profile of profilesData) {
            if (profile.phone) {
              console.log(`Comparaison profil: "${profile.phone}" vs "${formattedPhone}"`);
              
              if (phoneNumbersMatch(profile.phone, formattedPhone, countryCode)) {
                console.log("✓ Correspondance trouvée dans profiles:", profile.phone);
                console.log("ID utilisateur trouvé directement dans profiles:", profile.id);
                
                const finalResult = {
                  verified: true,
                  recipientData: {
                    email: profile.phone,
                    fullName: profile.full_name || `Utilisateur ${profile.phone}`,
                    country: profile.country || recipient.country,
                    userId: profile.id // Important: include the user ID
                  }
                };
                
                toast({
                  title: "Bénéficiaire trouvé",
                  description: finalResult.recipientData.fullName,
                });
                
                setRecipientVerified(true);
                setIsLoading(false);
                return finalResult;
              }
            }
          }
        }
        
        // Strategy 2: Check auth_users_view if no match in profiles
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
        
        console.log("Nombre d'utilisateurs trouvés dans auth_users_view:", authUserData?.length);
        
        // 2. Recherche approfondie à travers les métadonnées des utilisateurs
        if (authUserData && authUserData.length > 0) {
          for (const user of authUserData) {
            if (user.raw_user_meta_data) {
              const metadata = user.raw_user_meta_data as any;
              console.log(`Vérification de l'utilisateur: ${user.id}`);
              
              // Récupérer le numéro de téléphone des métadonnées
              const userPhone = metadata.phone || '';
              console.log(`Téléphone dans les métadonnées: ${userPhone}`);
              
              if (!userPhone) continue;
              
              // Utiliser notre fonction avancée de comparaison de numéros
              if (phoneNumbersMatch(userPhone, formattedPhone, countryCode)) {
                console.log("✓ Correspondance trouvée dans auth_users_view!");
                
                // Extraire le nom des métadonnées
                const displayName = extractNameFromMetadata(metadata) || metadata.full_name || metadata.fullName || "Utilisateur";
                
                if (displayName) {
                  console.log("Nom trouvé dans les métadonnées:", displayName);
                  console.log("ID utilisateur trouvé dans auth_users_view:", user.id);
                  
                  // IMPROVED: Check if the user has a profile and create one if needed
                  const { data: profileData } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', user.id)
                    .single();
                  
                  if (profileData) {
                    console.log("Profil utilisateur existant trouvé:", profileData.id);
                  } else {
                    console.log("Aucun profil trouvé, vérification du profil par téléphone");
                    
                    // Look for a profile with matching phone number
                    const { data: phoneProfileData } = await supabase
                      .from('profiles')
                      .select('id')
                      .eq('phone', userPhone)
                      .single();
                    
                    if (!phoneProfileData) {
                      console.log("Création d'un nouveau profil pour l'utilisateur");
                      // Create a profile for this user if none exists
                      await supabase.from('profiles').insert({
                        id: user.id,
                        full_name: displayName,
                        phone: userPhone,
                        country: metadata.country || recipient.country || "Cameroun",
                        balance: 0
                      });
                    }
                  }
                  
                  // Return verified user data with ID
                  const finalResult = {
                    verified: true,
                    recipientData: {
                      email: userPhone,
                      fullName: displayName,
                      country: metadata.country || recipient.country,
                      userId: user.id
                    }
                  };
                  
                  toast({
                    title: "Bénéficiaire trouvé",
                    description: finalResult.recipientData.fullName,
                  });
                  
                  setRecipientVerified(true);
                  setIsLoading(false);
                  return finalResult;
                }
              }
            }
          }
        }
        
        // Strategy 3: Last digit matching for phone numbers
        // This sometimes finds matches that the other methods miss
        console.log("Recherche par derniers chiffres du numéro...");
        const lastDigits = normalizePhoneNumber(formattedPhone).slice(-8);
        
        if (lastDigits.length >= 8 && profilesData) {
          for (const profile of profilesData) {
            if (profile.phone) {
              const profileLastDigits = normalizePhoneNumber(profile.phone).slice(-8);
              if (profileLastDigits === lastDigits) {
                console.log("✓ Correspondance trouvée par les 8 derniers chiffres:", profile.id);
                
                const finalResult = {
                  verified: true,
                  recipientData: {
                    email: profile.phone,
                    fullName: profile.full_name || `Utilisateur ${profile.phone}`,
                    country: profile.country || recipient.country,
                    userId: profile.id
                  }
                };
                
                toast({
                  title: "Bénéficiaire trouvé",
                  description: finalResult.recipientData.fullName,
                });
                
                setRecipientVerified(true);
                setIsLoading(false);
                return finalResult;
              }
            }
          }
        }
        
        // 4. Si aucun utilisateur n'est trouvé, permettre le transfert vers un numéro non enregistré
        console.log("Aucun utilisateur trouvé avec ce numéro:", formattedPhone);
        
        const noUserResult = {
          verified: false,
          recipientData: {
            email: formattedPhone,
            fullName: recipient.fullName || formattedPhone, // Utiliser le nom fourni ou le numéro
            country: recipient.country,
          }
        };
        
        toast({
          title: "Numéro non trouvé",
          description: "Ce numéro n'est pas enregistré dans le système",
          variant: "destructive",
        });
        
        setIsLoading(false);
        return noUserResult;
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la vérification",
        variant: "destructive",
      });
      setIsLoading(false);
      return { verified: false };
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
