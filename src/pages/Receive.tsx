import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { countries } from "@/data/countries";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const Receive = () => {
  const [selectedCountry, setSelectedCountry] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Récupérer le profil de l'utilisateur
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

  // Calculer les frais (2.5%)
  const fees = amount * 0.025;
  const total = amount + fees;

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

    if (!selectedCountry || !amount || amount <= 0) {
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
          amount: total,
          phone: profile.phone,
          country: selectedCountry,
          userId: user.id,
          currency: selectedCurrency
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
        <Link to="/">
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

              {selectedCountry && amount > 0 && (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Montant :</span>
                    <span>{amount.toLocaleString('fr-FR')} {selectedCurrency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Frais (2.5%) :</span>
                    <span>{fees.toLocaleString('fr-FR')} {selectedCurrency}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-primary/10">
                    <span>Total :</span>
                    <span>{total.toLocaleString('fr-FR')} {selectedCurrency}</span>
                  </div>
                </div>
              )}

              <Button 
                className="w-full mt-6" 
                disabled={!selectedCountry || !amount || amount <= 0 || isLoading}
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