
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface CreateSavingsAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateSavingsAccountModal = ({ isOpen, onClose, onSuccess }: CreateSavingsAccountModalProps) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !targetAmount || !user) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    
    try {
      const { error } = await supabase
        .from('savings_accounts')
        .insert({
          user_id: user.id,
          name,
          target_amount: parseFloat(targetAmount),
          interest_rate: 5.0
        });

      if (error) throw error;
      
      toast({
        title: "Compte créé",
        description: `Le compte d'épargne "${name}" a été créé avec succès`,
      });
      
      setName('');
      setTargetAmount('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le compte d'épargne",
        variant: "destructive"
      });
    }
    
    setIsCreating(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un compte d'épargne</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account-name">Nom du compte</Label>
            <Input
              id="account-name"
              type="text"
              placeholder="Ex: Épargne vacances"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="target-amount">Objectif d'épargne (XAF)</Label>
            <Input
              id="target-amount"
              type="number"
              placeholder="100000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" disabled={isCreating} className="flex-1">
              {isCreating ? 'Création...' : 'Créer le compte'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSavingsAccountModal;
