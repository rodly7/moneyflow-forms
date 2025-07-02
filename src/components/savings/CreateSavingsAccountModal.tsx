
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CreateSavingsAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountCreated: () => void;
}

const CreateSavingsAccountModal = ({ 
  isOpen, 
  onClose, 
  onAccountCreated 
}: CreateSavingsAccountModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('savings_accounts' as any)
        .insert({
          user_id: user.id,
          name,
          target_amount: targetAmount ? parseFloat(targetAmount) : null,
          target_date: targetDate || null,
          balance: 0,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Compte d'épargne créé",
        description: `Le compte "${name}" a été créé avec succès`,
      });

      onAccountCreated();
      onClose();
      setName("");
      setTargetAmount("");
      setTargetDate("");
    } catch (error) {
      console.error('Erreur lors de la création du compte:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le compte d'épargne",
        variant: "destructive"
      });
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Créer un compte d'épargne</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nom du compte</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Vacances 2024"
              required
            />
          </div>

          <div>
            <Label htmlFor="target">Objectif (optionnel)</Label>
            <Input
              id="target"
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="Montant visé"
            />
          </div>

          <div>
            <Label htmlFor="date">Date cible (optionnel)</Label>
            <Input
              id="date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !name}
              className="flex-1"
            >
              {isLoading ? "Création..." : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSavingsAccountModal;
