
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CreateSavingsAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountCreated: () => void;
}

const CreateSavingsAccountModal = ({ isOpen, onClose, onAccountCreated }: CreateSavingsAccountModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    target_amount: "",
    target_date: "",
    auto_deposit_amount: "",
    auto_deposit_frequency: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('savings_accounts')
        .insert({
          user_id: user.id,
          name: formData.name,
          target_amount: formData.target_amount ? parseFloat(formData.target_amount) : null,
          target_date: formData.target_date || null,
          auto_deposit_amount: formData.auto_deposit_amount ? parseFloat(formData.auto_deposit_amount) : null,
          auto_deposit_frequency: formData.auto_deposit_frequency || null
        });

      if (error) throw error;

      toast({
        title: "Compte d'épargne créé",
        description: "Votre nouveau compte d'épargne a été créé avec succès !",
      });

      onAccountCreated();
      onClose();
      setFormData({
        name: "",
        target_amount: "",
        target_date: "",
        auto_deposit_amount: "",
        auto_deposit_frequency: ""
      });
    } catch (error) {
      console.error('Erreur lors de la création du compte d\'épargne:', error);
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer un compte d'épargne</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nom du compte *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Vacances, Voiture, Urgences..."
              required
            />
          </div>

          <div>
            <Label htmlFor="target_amount">Objectif d'épargne (FCFA)</Label>
            <Input
              id="target_amount"
              type="number"
              value={formData.target_amount}
              onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
              placeholder="Montant à épargner"
            />
          </div>

          <div>
            <Label htmlFor="target_date">Date limite</Label>
            <Input
              id="target_date"
              type="date"
              value={formData.target_date}
              onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="auto_deposit_amount">Dépôt automatique (FCFA)</Label>
            <Input
              id="auto_deposit_amount"
              type="number"
              value={formData.auto_deposit_amount}
              onChange={(e) => setFormData({ ...formData, auto_deposit_amount: e.target.value })}
              placeholder="Montant du dépôt automatique"
            />
          </div>

          {formData.auto_deposit_amount && (
            <div>
              <Label htmlFor="frequency">Fréquence</Label>
              <Select
                value={formData.auto_deposit_frequency}
                onValueChange={(value) => setFormData({ ...formData, auto_deposit_frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir la fréquence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Quotidien</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name} className="flex-1">
              {isLoading ? "Création..." : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSavingsAccountModal;
