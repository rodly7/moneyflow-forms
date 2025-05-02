
import { Card } from "@/components/ui/card";
import { TransferData } from "@/types/transfer";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase, calculateFee } from "@/integrations/supabase/client";

type TransferSummaryProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const TransferSummary = ({ recipient, transfer }: TransferSummaryProps) => {
  // Get current user's country and role from profile/context
  const { user, userRole } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('country')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }
      return data;
    },
  });

  const userCountry = profile?.country || "Cameroun"; // Default to Cameroun if profile not found
  
  // Apply different fee rates based on whether the transfer is national or international
  const isInternational = recipient.country && recipient.country !== userCountry;
  
  // Calculate fees using the new function with user role
  const { fee: fees } = calculateFee(transfer.amount, userCountry, recipient.country, userRole || 'user');
  const total = transfer.amount + fees;

  // Format fee percentage for display
  const feePercentageDisplay = userRole === 'agent' 
    ? (isInternational ? '2%' : '0.5%') 
    : (isInternational ? '4%' : '1.5%');

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-primary">Résumé du Transfert</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Veuillez vérifier les détails de votre transfert
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="p-6 space-y-4 bg-white/50">
          <h4 className="font-medium text-lg text-primary">Informations du Bénéficiaire</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <span className="text-muted-foreground">Nom :</span>
            <span className="font-medium">{recipient.fullName}</span>
            <span className="text-muted-foreground">Email :</span>
            <span className="font-medium">{recipient.email}</span>
            <span className="text-muted-foreground">Pays :</span>
            <span className="font-medium">{recipient.country}</span>
          </div>
        </Card>

        <Card className="p-6 space-y-4 bg-primary/5 border-primary/10">
          <h4 className="font-medium text-lg text-primary">Détails du Transfert</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <span className="text-muted-foreground">Montant :</span>
            <span className="font-medium">
              {transfer.amount.toLocaleString('fr-FR')} {transfer.currency}
            </span>
            <span className="text-muted-foreground">
              Frais ({feePercentageDisplay}) :
            </span>
            <span className="font-medium">
              {fees.toLocaleString('fr-FR')} {transfer.currency}
            </span>
            <span className="text-muted-foreground">Total :</span>
            <span className="font-medium text-lg">
              {total.toLocaleString('fr-FR')} {transfer.currency}
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TransferSummary;
