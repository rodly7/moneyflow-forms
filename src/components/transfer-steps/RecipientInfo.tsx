
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TransferData } from "@/types/transfer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type RecipientInfoProps = {
  recipient: TransferData['recipient'];
  updateFields: (fields: Partial<TransferData>) => void;
};

const RecipientInfo = ({ recipient, updateFields }: RecipientInfoProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isValidEmail = (email: string) => {
    // Regex basique pour la validation d'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Vérifie si l'email commence par des chiffres uniquement
    const startsWithNumbersOnly = /^[0-9]+@/;
    
    return emailRegex.test(email) && !startsWithNumbersOnly.test(email);
  };

  const verifyEmail = async (email: string) => {
    if (!email) return;

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
      
      // Rechercher le profil via l'adresse email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('full_name, email')
        .ilike('email', email)
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
        console.log("Aucun utilisateur trouvé avec cet email:", email);
        toast({
          title: "Email non trouvé",
          description: "Cette adresse email n'est pas enregistrée dans le système",
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
