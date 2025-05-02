
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase, processWithdrawal, formatCurrency, getCurrencyForCountry, calculateFee } from "@/integrations/supabase/client";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

// Define Profile type to ensure we have the right properties
interface Profile {
  id: string;
  full_name: string | null;
  phone: string;
  country: string | null;
  address: string | null;
  balance: number;
  is_verified: boolean | null;
  avatar_url: string | null;
}

const Withdraw = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showVerificationCode, setShowVerificationCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [currency, setCurrency] = useState("XAF");
  const [feeAmount, setFeeAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('country, phone, full_name')
            .eq('id', user.id)
            .single();
          
          if (error) {
            console.error("Error fetching user profile:", error);
            setIsLoading(false);
            return;
          }
          
          if (data) {
            const userCountry = data.country || "Congo Brazzaville";
            setCountry(userCountry);
            setPhoneNumber(data.phone || "");
            setFullName(data.full_name || "");
            setCurrency(getCurrencyForCountry(userCountry));
            
            const selectedCountry = countries.find(c => c.name === userCountry);
            if (selectedCountry) {
              setCountryCode(selectedCountry.code);
            }
          }
        } catch (error) {
          console.error("Error in fetchUserProfile:", error);
        }
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, navigate]);

  // Calculate fee when amount changes
  useEffect(() => {
    if (amount && !isNaN(Number(amount))) {
      const amountValue = Number(amount);
      const { fee } = calculateFee(amountValue);
      setFeeAmount(fee);
      setTotalAmount(amountValue);
    } else {
      setFeeAmount(0);
      setTotalAmount(0);
    }
  }, [amount]);

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

    try {
      setIsProcessing(true);

      if (!user?.id) {
        throw new Error("Utilisateur non connecté");
      }

      const formattedPhone = phoneNumber.startsWith('+') 
        ? phoneNumber 
        : `${countryCode}${phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber}`;

      // Process the withdrawal in Supabase and get back the verification code
      const withdrawalResult = await processWithdrawal(user.id, Number(amount), formattedPhone);
      
      // Set verification code for display
      setVerificationCode(withdrawalResult.verificationCode);
      setShowVerificationCode(true);

    } catch (error) {
      console.error("Erreur lors du retrait:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors du retrait",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  const handleFinish = () => {
    setShowVerificationCode(false);
    navigate('/');
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
                  <Label htmlFor="amount">Montant ({currency})</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder={`Entrez le montant en ${currency}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                
                {amount && Number(amount) > 0 && (
                  <div className="px-3 py-2 bg-gray-50 rounded-md text-sm">
                    <div className="flex justify-between">
                      <span>Montant:</span>
                      <span>{formatCurrency(Number(amount), currency)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Frais (2%):</span>
                      <span>{formatCurrency(feeAmount, currency)}</span>
                    </div>
                    <div className="border-t mt-2 pt-2 flex justify-between font-medium">
                      <span>Total:</span>
                      <span>{formatCurrency(Number(amount), currency)}</span>
                    </div>
                  </div>
                )}
                
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
                  <Label htmlFor="phone">Numéro de téléphone</Label>
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

      {/* Verification Code Dialog */}
      <Dialog open={showVerificationCode} onOpenChange={setShowVerificationCode}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Code de vérification pour votre retrait</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4 space-y-4">
            <p className="text-center text-sm text-gray-600">
              Partagez ce code avec la personne qui va confirmer votre retrait de {formatCurrency(Number(amount), currency)}.
            </p>
            
            <div className="bg-gray-100 p-5 rounded-lg shadow-sm w-full">
              <InputOTP maxLength={6} value={verificationCode} disabled>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            
            <div className="text-center font-bold text-2xl tracking-widest my-2">
              {verificationCode}
            </div>
            
            <p className="text-center text-xs text-gray-500">
              Ce code est valide jusqu'à ce que le retrait soit confirmé.
            </p>
            
            <Button 
              onClick={handleFinish}
              className="w-full mt-4"
            >
              Terminer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Withdraw;

import { countries } from "@/data/countries";
