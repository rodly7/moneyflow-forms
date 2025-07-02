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
  account: any;
  onSuccess: () => void;
}

const SavingsDepositModal = ({ 
  isOpen, 
  onClose, 
  account, 
  onSuccess 
}: SavingsDepositModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [userBalance, setUserBalance] = useState(0);

  const fetchUserBalance = async () => {
    if (!user?.id) return;
    
    setIsLoadingBalance(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      // Cast data to ensure it has the correct type
      const profileData = data as { balance: number };
      setUserBalance(profileData.balance || 0);
    } catch (error) {
      console.error("Erreur lors du chargement du solde:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger votre solde",
        variant: "destructive"
      });
    }
    setIsLoadingBalance(false);
  };

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

      // Get current savings account balance first
      const { data: currentAccount, error: fetchError } = await supabase
        .from('savings_accounts' as any)
        .select('balance')
        .eq('id', account.id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Safely access balance with proper typing
      const currentBalance = (currentAccount as any)?.balance || 0;
      const newBalance = currentBalance + depositAmount;

      // Update the savings account balance
      const { error: savingsError } = await supabase
        .from('savings_accounts' as any)
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id)
        .eq('user_id', user.id);

      if (savingsError) throw savingsError;

      // Enregistrer l'historique du dépôt
      const { error: depositError } = await supabase
        .from('savings_deposits' as any)
        .insert({
          savings_account_id: account.id,
          user_id: user.id,
          amount: depositAmount,
          type: 'manual'
        });

      if (depositError) throw depositError;

      toast({
        title: "Dépôt effectué",
        description: `${formatCurrency(depositAmount, "XAF")} transféré vers ${account.name}`,
      });

      onSuccess();
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
          <DialogTitle>Dépôt vers {account.name}</DialogTitle>
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
