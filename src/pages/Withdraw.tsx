import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Withdraw = () => {
  const [amount, setAmount] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const handleWithdraw = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un montant valide",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;

      if (profile.balance < Number(amount)) {
        toast({
          title: "Solde insuffisant",
          description: "Votre solde est insuffisant pour effectuer ce retrait",
          variant: "destructive",
        });
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          balance: profile.balance - Number(amount)
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      toast({
        title: "Retrait effectué",
        description: `${amount}€ ont été retirés de votre compte`,
      });

      setAmount("");
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du retrait",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-8 px-4">
      <div className="container max-w-3xl mx-auto">
        <Link to="/dashboard">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>
        
        <Card>
          <CardHeader>
            <CardTitle>Retirer de l'argent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="amount">Montant à retirer (€)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="mt-2"
              />
            </div>
            
            <Button 
              onClick={handleWithdraw}
              className="w-full"
            >
              Retirer
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Withdraw;