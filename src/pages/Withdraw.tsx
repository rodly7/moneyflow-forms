import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Banknote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase, formatCurrency, getCurrencyForCountry } from "@/integrations/supabase/client";
import { countries } from "@/data/countries";
import PhoneInput from "@/components/transfer-steps/PhoneInput";
import { useRecipientVerification } from "@/hooks/useRecipientVerification";

const Withdraw = () => {
  const { user, isAgent } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [countryCode, setCountryCode] = useState("+237");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currency, setCurrency] = useState("XAF");
  const [feeAmount, setFeeAmount] = useState(0);
  const [recipientName, setRecipientName] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [verificationAttempted, setVerificationAttempted] = useState(false);
  
  // Use the recipient verification hook for agents to verify clients
  const {
    isLoading: isVerifying,
    recipientVerified: isVerified,
    verifyRecipient,
    setRecipientVerified
  } = useRecipientVerification();

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
      // Frais de 2% (0.5% pour l'agent, 1.5% pour MoneyFlow)
      const fee = amountValue * 0.02;
      setFeeAmount(fee);
    } else {
      setFeeAmount(0);
    }
  }, [amount]);

  // Handle phone number verification for agents
  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
    // Reset verification if phone changes
    if (isVerified || verificationAttempted) {
      setRecipientVerified(false);
      setRecipientName("");
      setRecipientId("");
      setVerificationAttempted(false);
    }
  };

  // Verify recipient for agents
  const handleVerifyRecipient = async () => {
    if (!isAgent() || !phoneNumber || phoneNumber.length < 6) return;
    
    setVerificationAttempted(true);
    
    // Format full phone number with country code
    const fullPhone = phoneNumber.startsWith('+') 
      ? phoneNumber 
      : `${countryCode}${phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber}`;
    
    try {
      const result = await verifyRecipient(fullPhone, countryCode, {
        fullName: "",
        email: fullPhone,
        country: country || "Cameroun"
      });
      
      if (result.verified && result.recipientData) {
        setRecipientName(result.recipientData.fullName);
        
        // Use the userId from recipientData if available
        if (result.recipientData.userId) {
          setRecipientId(result.recipientData.userId);
          setRecipientVerified(true);
          toast({
            title: "Bénéficiaire trouvé",
            description: `${result.recipientData.fullName} a été trouvé dans la base de données`
          });
          return;
        }
        
        // Fallback: search directly by phone number
        const { data: profileByPhone } = await supabase
          .from('profiles')
          .select('id, balance')
          .eq('phone', fullPhone)
          .single();
        
        if (profileByPhone) {
          setRecipientId(profileByPhone.id);
          setRecipientVerified(true);
          return;
        }

        // Fallback: search by last 8 digits
        const lastDigits = fullPhone.replace(/\D/g, '').slice(-8);
        
        if (lastDigits.length >= 8) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, phone, balance');
          
          if (profiles) {
            const matchingProfile = profiles.find(profile => {
              if (!profile.phone) return false;
              const profileLastDigits = profile.phone.replace(/\D/g, '').slice(-8);
              return profileLastDigits === lastDigits;
            });
            
            if (matchingProfile) {
              setRecipientId(matchingProfile.id);
              setRecipientVerified(true);
              return;
            }
          }
        }
        
        toast({
          title: "Utilisateur non trouvé",
          description: "Impossible de trouver cet utilisateur dans la base de données",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error("Error checking recipient:", err);
      toast({
        title: "Erreur de vérification",
        description: "Une erreur s'est produite lors de la vérification du destinataire",
        variant: "destructive"
      });
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

    try {
      setIsProcessing(true);

      if (!user?.id) {
        throw new Error("Utilisateur non connecté");
      }

      const formattedPhone = phoneNumber.startsWith('+') 
        ? phoneNumber 
        : `${countryCode}${phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber}`;
      
      const amountValue = Number(amount);
      
      if (isAgent()) {
        // Agent initiating a withdrawal - create pending withdrawal request
        if (!recipientId) {
          throw new Error("Veuillez d'abord vérifier le client");
        }
        
        // Check if client has sufficient balance
        const { data: clientProfile, error: clientProfileError } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', recipientId)
          .single();

        if (clientProfileError) {
          throw new Error("Impossible de vérifier le solde du client");
        }

        if (!clientProfile) {
          throw new Error("Profil client introuvable");
        }

        if (clientProfile.balance < amountValue) {
          throw new Error("Solde insuffisant pour effectuer ce retrait");
        }

        // Calculate fees
        const agentCommission = amountValue * 0.005;
        const platformCommission = amountValue * 0.015;
        const totalFees = agentCommission + platformCommission;
        
        // Generate verification code for client confirmation
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Create withdrawal request with pending status
        const { error: withdrawalError } = await supabase
          .from('withdrawals')
          .insert({
            user_id: recipientId,
            amount: amountValue,
            withdrawal_phone: formattedPhone,
            status: 'agent_pending', // New status for agent-initiated withdrawals
            verification_code: verificationCode,
            fee: totalFees,
            agent_commission: agentCommission,
            platform_commission: platformCommission,
            agent_id: user.id
          });

        if (withdrawalError) {
          throw withdrawalError;
        }

        // Send notification to client (you would implement actual push notification here)
        toast({
          title: "Demande de retrait envoyée",
          description: `Une demande de retrait de ${amountValue} FCFA a été envoyée à ${recipientName}. En attente de confirmation du client.`,
        });

        // Here you would send an actual notification to the client
        // For now, we'll just create a notification record
        await supabase
          .from('notifications')
          .insert({
            user_id: recipientId,
            title: 'Demande de retrait',
            message: `Un agent souhaite effectuer un retrait de ${amountValue} FCFA sur votre compte. Code de confirmation: ${verificationCode}`,
            type: 'withdrawal_request',
            data: {
              withdrawalCode: verificationCode,
              agentId: user.id,
              amount: amountValue
            }
          });

      } else {
        // Regular user requesting a withdrawal
        // Generate a verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Create withdrawal record with verification code
        const { error: withdrawalError } = await supabase
          .from('withdrawals')
          .insert({
            user_id: user.id,
            amount: amountValue,
            withdrawal_phone: formattedPhone,
            status: 'pending',
            verification_code: verificationCode
          });
        
        if (withdrawalError) {
          throw withdrawalError;
        }
        
        toast({
          title: "Demande de retrait enregistrée",
          description: `Veuillez vous rendre chez un agent pour finaliser votre retrait de ${formatCurrency(amountValue, currency)}. Votre code de retrait: ${verificationCode}`,
        });
      }
      
      // Reset form and redirect
      setAmount("");
      setPhoneNumber("");
      setRecipientVerified(false);
      setRecipientName("");
      setRecipientId("");
      navigate('/dashboard');

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
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-4 px-0 sm:py-8 sm:px-4">
      <div className="container max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-gray-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Retrait</h1>
          <div className="w-10"></div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isAgent() ? "Effectuer un retrait pour un client" : "Demande de retrait"}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {isAgent() ? (
                  <PhoneInput
                    phoneInput={phoneNumber}
                    countryCode={countryCode}
                    onPhoneChange={handlePhoneChange}
                    isLoading={isVerifying}
                    isVerified={isVerified}
                    recipientName={recipientName}
                    label="Numéro du client"
                    onBlurComplete={handleVerifyRecipient}
                  />
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nom complet</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      readOnly
                      className="bg-gray-100"
                    />

                    <div className="space-y-2 mt-4">
                      <Label htmlFor="phone">Numéro de téléphone</Label>
                      <div className="flex items-center space-x-2">
                        <div className="bg-gray-100 px-3 py-2 rounded-md border border-input text-sm">
                          {countryCode}
                        </div>
                        <Input
                          id="phone"
                          type="tel"
                          className="flex-1"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}
              
                <div className="space-y-2">
                  <Label htmlFor="amount">Montant ({currency})</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder={`Entrez le montant en ${currency}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="h-12 text-lg"
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

                {!isAgent() && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
                    <p>Pour retirer votre argent, rendez-vous chez un agent MoneyFlow avec votre téléphone.</p>
                    <p className="mt-1">L'agent vous aidera à finaliser votre retrait.</p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4 h-12 text-lg"
                  disabled={isProcessing || (isAgent() && !recipientId)}
                >
                  {isProcessing ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span>Traitement en cours...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Banknote className="mr-2 h-5 w-5" />
                      <span>{isAgent() ? "Effectuer le retrait" : "Continuer"}</span>
                    </div>
                  )}
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
