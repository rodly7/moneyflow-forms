
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TransferData } from "@/types/transfer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type RecipientInfoProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const RecipientInfo = ({ recipient, updateFields }: RecipientInfoProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const verifyEmail = async (email: string) => {
    if (!email) return;

    try {
      setIsLoading(true);
      console.log("Vérification de l'email:", email);
      
      // Vérifier dans auth.users via profiles qui est synchronisé
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', (
          await supabase.auth.admin.listUsers()
        ).data.users.find(u => u.email === email)?.id)
        .single();

      if (error) {
        console.error('Erreur lors de la vérification:', error);
        toast({
          title: "Erreur",
          description: "Impossible de vérifier l'adresse email",
          variant: "destructive",
        });
        return;
      }

      if (!profile) {
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

      console.log("Bénéficiaire trouvé:", profile);
      // Mettre à jour les informations du bénéficiaire
      updateFields({
        recipient: {
          ...recipient,
          email: email,
          fullName: profile.full_name || '',
          country: recipient.country,
        }
      });

      toast({
        title: "Bénéficiaire trouvé",
        description: profile.full_name,
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
          placeholder="Ex: exemple@email.com"
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

