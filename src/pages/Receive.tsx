import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { countries } from "@/data/countries";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const Receive = () => {
  const [selectedCountry, setSelectedCountry] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Récupérer le profil de l'utilisateur pour avoir son pays de résidence
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Définir le pays par défaut basé sur le profil
  useEffect(() => {
    if (profile?.country) {
      setSelectedCountry(profile.country);
    }
  }, [profile]);

  // Obtenir les méthodes de paiement disponibles pour le pays sélectionné
  const availablePaymentMethods = selectedCountry ? 
    countries.find(c => c.name === selectedCountry)?.paymentMethods || [] 
    : [];

  const selectedCurrency = selectedCountry ? 
    (selectedCountry === "Sénégal" ? "XOF" : "XAF")
    : "XAF";

  const handlePayment = async () => {
    if (!user || !profile) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour effectuer une recharge",
        variant: "destructive"
      });
      return;
    }

    if (!selectedCountry || !amount || amount <= 0 || !paymentMethod) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs correctement",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);

      const { data, error } = await supabase.functions.invoke('initiate-payment', {
        body: {
          amount: amount,
          phone: profile.phone,
          country: selectedCountry,
          userId: user.id,
          currency: selectedCurrency,
          paymentMethod: paymentMethod
        }
      });

      if (error) throw error;

      toast({
        title: "Recharge réussie",
        description: `Votre compte a été rechargé de ${amount} ${selectedCurrency}`,
      });

      navigate('/dashboard');

    } catch (error) {
      console.error('Erreur lors de l\'initiation du paiement:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'initiation du paiement",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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
            <CardTitle>Recharger mon compte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="country">Pays</Label>
                <Select
                  value={selectedCountry}
                  onValueChange={setSelectedCountry}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez votre pays" />
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

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Mode de paiement</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  disabled={!selectedCountry}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le mode de paiement" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePaymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Montant à recharger ({selectedCurrency})</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder={`Entrez le montant en ${selectedCurrency}`}
                />
              </div>

              <Button 
                className="w-full mt-6" 
                disabled={!selectedCountry || !amount || amount <= 0 || !paymentMethod || isLoading}
                onClick={handlePayment}
              >
                {isLoading ? "Traitement en cours..." : "Recharger"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Receive;