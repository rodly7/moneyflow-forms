
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/integrations/supabase/client";

interface SavingsDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  accountName: string;
  userBalance: number;
  onDepositSuccess: () => void;
}

const SavingsDepositModal = ({ 
  isOpen, 
  onClose, 
  accountId, 
  accountName, 
  userBalance,
  onDepositSuccess 
}: SavingsDepositModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount) return;

    const depositAmount = parseFloat(amount);

    if (depositAmount <= 0) {
      toast({
        title: "Montant invalide",
        description: "Le montant doit être supérieur à 0",
        variant: "destructive"
      });
      return;
    }

    if (depositAmount > userBalance) {
      toast({
        title: "Solde insuffisant",
        description: "Vous n'avez pas assez de fonds dans votre compte principal",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Débiter le compte principal
      const { error: balanceError } = await supabase.rpc('increment_balance', {
        user_id: user.id,
        amount: -depositAmount
      });

      if (balanceError) throw balanceError;

      // Créditer le compte d'épargne
      const { error: savingsError } = await supabase
        .from('savings_accounts')
        .update({ 
          balance: depositAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId)
        .eq('user_id', user.id);

      if (savingsError) throw savingsError;

      // Enregistrer l'historique du dépôt
      const { error: depositError } = await supabase
        .from('savings_deposits')
        .insert({
          savings_account_id: accountId,
          user_id: user.id,
          amount: depositAmount,
          type: 'manual'
        });

      if (depositError) throw depositError;

      toast({
        title: "Dépôt effectué",
        description: `${formatCurrency(depositAmount, "XAF")} transféré vers ${accountName}`,
      });

      onDepositSuccess();
      onClose();
      setAmount("");
    } catch (error) {
      console.error('Erreur lors du dépôt:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer le dépôt",
        variant: "destructive"
      });
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Dépôt vers {accountName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-700">
              Solde disponible : {formatCurrency(userBalance, "XAF")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="amount">Montant à déposer (FCFA)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Montant"
                required
                min="1"
                max={userBalance}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !amount || parseFloat(amount) <= 0}
                className="flex-1"
              >
                {isLoading ? "Dépôt..." : "Déposer"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SavingsDepositModal;
