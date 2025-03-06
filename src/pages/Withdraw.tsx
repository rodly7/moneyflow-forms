import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { processWithdrawal } from "@/integrations/supabase/client";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { countries } from "@/data/countries";
import { supabase } from "@/integrations/supabase/client";

const Withdraw = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('country, phone, full_name')
          .eq('id', user.id)
          .single();
        
        if (!error && data) {
          const userCountry = data.country || "Congo Brazzaville";
          setCountry(userCountry);
          setPhoneNumber(data.phone || "");
          setFullName(data.full_name || "");
          
          const selectedCountry = countries.find(c => c.name === userCountry);
          if (selectedCountry) {
            setCountryCode(selectedCountry.code);
            setPaymentMethods(selectedCountry.paymentMethods);
            if (selectedCountry.paymentMethods.length > 0) {
              setPaymentMethod(selectedCountry.paymentMethods[0]);
            }
          }
        }
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleCountryChange = (value: string) => {
    setCountry(value);
    
    const selectedCountry = countries.find(c => c.name === value);
    if (selectedCountry) {
      setCountryCode(selectedCountry.code);
      setPaymentMethods(selectedCountry.paymentMethods);
      
      if (selectedCountry.paymentMethods.length > 0) {
        setPaymentMethod(selectedCountry.paymentMethods[0]);
      } else {
        setPaymentMethod("");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide",
        variant: "destructive"
      });
      return;
    }

    if (!phoneNumber) {
      toast({
        title: "Numéro de téléphone requis",
        description: "Veuillez entrer un numéro de téléphone pour le retrait",
        variant: "destructive"
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Méthode de paiement requise",
        description: "Veuillez sélectionner une méthode de paiement",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);

      if (!user?.id) {
        throw new Error("Utilisateur non connecté");
      }

      const formattedPhone = phoneNumber.startsWith('+') 
        ? phoneNumber 
        : `${countryCode}${phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber}`;

      await processWithdrawal(user.id, Number(amount), formattedPhone);

      toast({
        title: "Demande de retrait envoyée",
        description: `Votre demande de retrait de ${amount} XAF via ${paymentMethod} a été soumise et est en cours de traitement.`,
      });

      navigate('/');
    } catch (error) {
      console.error("Erreur lors du retrait:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors du retrait",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-4 px-0">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center justify-between px-4 mb-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')}
            className="text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Retrait d'argent</h1>
          <div className="w-9"></div>
        </div>

        <Card className="mx-4">
          <CardHeader>
            <CardTitle className="text-lg">Demande de retrait</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    readOnly
                    className="bg-gray-100"
                  />
                </div>
              
                <div className="space-y-2">
                  <Label htmlFor="amount">Montant (XAF)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Entrez le montant"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">Pays</Label>
                  <Input
                    id="country"
                    type="text"
                    value={country}
                    readOnly
                    className="bg-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Méthode de paiement</Label>
                  <Select 
                    value={paymentMethod} 
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionnez une méthode de paiement" />
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
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Numéro de téléphone Mobile Money</Label>
                  <div className="flex items-center space-x-2">
                    <div className="bg-gray-100 px-3 py-2 rounded-md border border-input text-sm">
                      {countryCode}
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      className="flex-1 bg-gray-100"
                      value={phoneNumber}
                      readOnly
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Le numéro qui recevra l'argent via {paymentMethod || "Mobile Money"}
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Traitement en cours..." : "Confirmer le retrait"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Withdraw;
