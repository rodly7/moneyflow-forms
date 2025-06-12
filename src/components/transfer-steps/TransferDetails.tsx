
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TransferData } from "@/types/transfer";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { calculateFee } from "@/integrations/supabase/client";

type TransferDetailsProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const TransferDetails = ({ transfer, recipient, updateFields }: TransferDetailsProps) => {
  // Get current user's role from context
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  
  // Pour les agents, restreindre aux transferts internationaux uniquement
  useEffect(() => {
    if (userRole === 'agent' && recipient.country && recipient.country === "Cameroun") {
      toast({
        title: "Transfert non autorisé",
        description: "En tant qu'agent, vous ne pouvez effectuer que des transferts internationaux",
        variant: "destructive"
      });
      // Reset the recipient country
      updateFields({
        recipient: { ...recipient, country: "" }
      });
    }
  }, [recipient.country, userRole]);
  
  // Calculate fees using the updated function with new rates
  const { fee: fees, rate: feeRate } = calculateFee(
    transfer.amount, 
    "Cameroun", // Pays d'envoi par défaut (peut être dynamique selon le profil)
    recipient.country, 
    userRole || 'user'
  );
  
  const total = transfer.amount + fees;
  
  // Déterminer si c'est un transfert national ou international
  const isNational = "Cameroun" === recipient.country;
  const transferType = isNational ? "national" : "international";
  const feePercentageDisplay = `${feeRate}% (${transferType})`;

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
