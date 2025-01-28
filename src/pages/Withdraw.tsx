import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { countries } from "@/data/countries";
import { useQuery } from "@tanstack/react-query";

const Withdraw = () => {
  const [withdrawalCode, setWithdrawalCode] = useState("");
  const [amount, setAmount] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch user profile to get their country
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('country')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Find payment methods for user's country
  const userCountry = countries.find(c => c.name === profile?.country);
  const paymentMethods = userCountry?.paymentMethods || [];

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");

  const handleWithdraw = async () => {
    if (!withdrawalCode || !amount || !selectedPaymentMethod) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    try {
      const amountNum = Number(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        toast({
          title: "Erreur",
          description: "Veuillez entrer un montant valide",
          variant: "destructive",
        });
        return;
      }

      // Here you would typically validate the withdrawal code
      // and process the withdrawal through your payment system

      toast({
        title: "Retrait initié",
        description: `Votre retrait de ${amount}€ via ${selectedPaymentMethod} est en cours de traitement`,
      });

      // Redirect to dashboard after successful withdrawal
      navigate('/');
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
        <Link to="/">
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
              <Label htmlFor="withdrawalCode">Code de retrait</Label>
              <Input
                id="withdrawalCode"
                type="text"
                value={withdrawalCode}
                onChange={(e) => setWithdrawalCode(e.target.value)}
                placeholder="Entrez le code de retrait"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="amount">Montant à retirer</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="mt-2"
              />
            </div>

            <div>
              <Label>Mode de paiement</Label>
              <Select
                value={selectedPaymentMethod}
                onValueChange={setSelectedPaymentMethod}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Sélectionnez un mode de paiement" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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