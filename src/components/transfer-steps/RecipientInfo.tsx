
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TransferData } from "../TransferForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type RecipientInfoProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const RecipientInfo = ({ recipient, updateFields }: RecipientInfoProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const normalizePhoneNumber = (phone: string) => {
    // Si le numéro ne commence pas par +, l'ajouter
    if (!phone.startsWith('+')) {
      return `+${phone}`;
    }
    return phone;
  };

  const verifyPhoneNumber = async (phone: string) => {
    if (!phone) return;

    try {
      setIsLoading(true);
      const normalizedPhone = normalizePhoneNumber(phone);
      console.log("Vérification du numéro après normalisation:", normalizedPhone);
      
      // Vérifier dans auth.users via profiles qui est synchronisé
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('phone', normalizedPhone)
        .maybeSingle();

      if (error) {
        console.error('Erreur lors de la vérification:', error);
        toast({
          title: "Erreur",
          description: "Impossible de vérifier le numéro de téléphone",
          variant: "destructive",
        });
        return;
      }

      if (!profile) {
        console.log("Aucun utilisateur trouvé avec ce numéro:", normalizedPhone);
        toast({
          title: "Numéro non trouvé",
          description: "Ce numéro n'est pas enregistré dans le système",
          variant: "destructive",
        });
        // Réinitialiser les champs du bénéficiaire mais garder le numéro normalisé
        updateFields({
          recipient: {
            ...recipient,
            phone: normalizedPhone,
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
          phone: normalizedPhone,
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
        <Label>Numéro de téléphone du bénéficiaire</Label>
        <Input
          type="tel"
          placeholder="Ex: +221773637752"
          value={recipient.phone}
          onChange={(e) => {
            const phone = e.target.value;
            updateFields({
              recipient: {
                ...recipient,
                phone,
              }
            });
          }}
          onBlur={(e) => verifyPhoneNumber(e.target.value)}
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

