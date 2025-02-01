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

const Withdraw = () => {
  const [amount, setAmount] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Find payment methods for selected country
  const countryData = countries.find(c => c.name === selectedCountry);
  const paymentMethods = countryData?.paymentMethods || [];

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");

  // Reset payment method when country changes
  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    setSelectedPaymentMethod("");
  };

  const handleWithdraw = async () => {
    if (!amount || !selectedPaymentMethod || !selectedCountry) {
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

      toast({
        title: "Retrait initié",
        description: `Votre retrait de ${amount}€ via ${selectedPaymentMethod} est en cours de traitement`,
      });

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
              <Label>Pays de retrait</Label>
              <Select
                value={selectedCountry}
                onValueChange={handleCountryChange}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Sélectionnez un pays" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.name} value={country.name}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                disabled={!selectedCountry}
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