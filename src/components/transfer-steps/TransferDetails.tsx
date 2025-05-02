
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TransferData } from "@/types/transfer";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase, calculateFee } from "@/integrations/supabase/client";

type TransferDetailsProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const TransferDetails = ({ transfer, recipient, updateFields }: TransferDetailsProps) => {
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
  
  // Apply different fee rates based on role and transfer type
  const isInternational = recipient.country && recipient.country !== userCountry;
  
  // Calculate fees using the updated function with user role
  const { fee: fees, rate: feeRate } = calculateFee(
    transfer.amount, 
    userCountry, 
    recipient.country, 
    userRole || 'user'
  );
  
  const total = transfer.amount + fees;
  
  // Format fee percentage for display
  const feePercentageDisplay = userRole === 'agent' 
    ? (isInternational ? '2%' : '0.5%') 
    : (isInternational ? '4%' : '1.5%');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="amount">Montant à Envoyer ({transfer.currency})</Label>
        <Input
          id="amount"
          type="number"
          required
          min="0"
          step="100"
          placeholder={`Entrez le montant en ${transfer.currency}`}
          value={transfer.amount || ""}
          onChange={(e) =>
            updateFields({
              transfer: { ...transfer, amount: parseFloat(e.target.value) },
            })
          }
          className="text-lg"
        />
      </div>

      {transfer.amount > 0 && (
        <div className="mt-6 p-6 bg-primary/5 rounded-xl space-y-3 border border-primary/10">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Montant du transfert :</span>
            <span className="font-medium">
              {transfer.amount.toLocaleString('fr-FR')} {transfer.currency}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              Frais ({feePercentageDisplay}) :
            </span>
            <span className="font-medium">
              {fees.toLocaleString('fr-FR')} {transfer.currency}
            </span>
          </div>
          <div className="flex justify-between font-semibold pt-3 border-t border-primary/10 text-lg">
            <span>Total :</span>
            <span>
              {total.toLocaleString('fr-FR')} {transfer.currency}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferDetails;
