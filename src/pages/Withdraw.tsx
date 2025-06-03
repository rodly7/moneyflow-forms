import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Banknote, AlertCircle, User, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase, formatCurrency, getCurrencyForCountry, calculateFee } from "@/integrations/supabase/client";
import { countries } from "@/data/countries";
import PhoneInput from "@/components/transfer-steps/PhoneInput";
import { useRecipientVerification } from "@/hooks/useRecipientVerification";
import { useDiagnostic } from "@/hooks/useDiagnostic";

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
  const [recipientData, setRecipientData] = useState<any>(null);
  const [recipientBalance, setRecipientBalance] = useState<number>(0);
  const [verificationAttempted, setVerificationAttempted] = useState(false);
  const [withdrawalSent, setWithdrawalSent] = useState(false);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  
  const {
    isLoading: isVerifying,
    recipientVerified: isVerified,
    verifyRecipient,
    setRecipientVerified
  } = useRecipientVerification();

  const {
    analyzeUserByPhone,
    analyzeUserById,
    isAnalyzing: isDiagnosing
  } = useDiagnostic();

  // Fonction pour récupérer le solde utilisateur depuis la base de données
  const fetchUserBalance = async (userId: string) => {
    try {
      setIsLoadingBalance(true);
      console.log("Récupération du solde pour l'utilisateur:", userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('balance, full_name')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error("Erreur lors de la récupération du solde:", error);
        throw error;
      }
      
      if (data) {
        console.log("Solde récupéré depuis la BD:", data.balance);
        return {
          balance: data.balance || 0,
          fullName: data.full_name || ""
        };
      }
      
      return { balance: 0, fullName: "" };
    } catch (error) {
      console.error("Erreur dans fetchUserBalance:", error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer le solde utilisateur",
        variant: "destructive"
      });
      return { balance: 0, fullName: "" };
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Fonction unifiée pour chercher un utilisateur par téléphone
  const findUserByPhone = async (phoneNumber: string) => {
    const formattedPhone = phoneNumber.startsWith('+') 
      ? phoneNumber 
      : `${countryCode}${phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber}`;
    
    console.log("Recherche unifiée pour le numéro:", formattedPhone);
    
    // 1. Recherche directe par téléphone
    try {
      const { data: profileByPhone, error: phoneError } = await supabase
        .from('profiles')
        .select('id, full_name, balance, country, phone')
        .eq('phone', formattedPhone)
        .maybeSingle();
      
      if (!phoneError && profileByPhone) {
        console.log("✓ Utilisateur trouvé par recherche directe:", profileByPhone);
        return profileByPhone;
      }
    } catch (err) {
      console.log("Erreur recherche directe:", err);
    }
    
    // 2. Recherche par les 8 derniers chiffres
    console.log("Recherche par les 8 derniers chiffres...");
    const lastDigits = formattedPhone.replace(/\D/g, '').slice(-8);
    
    if (lastDigits.length >= 8) {
      try {
        const { data: allProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, phone, full_name, balance, country');
        
        if (!profilesError && allProfiles) {
          const matchingProfile = allProfiles.find(profile => {
            if (!profile.phone) return false;
            const profileLastDigits = profile.phone.replace(/\D/g, '').slice(-8);
            return profileLastDigits === lastDigits;
          });
          
          if (matchingProfile) {
            console.log("✓ Utilisateur trouvé par derniers chiffres:", matchingProfile);
            return matchingProfile;
          }
        }
      } catch (err) {
        console.log("Erreur recherche par derniers chiffres:", err);
      }
    }
    
    return null;
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('country, phone, full_name, balance')
            .eq('id', user.id)
            .maybeSingle();
          
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
            setUserBalance(data.balance || 0);
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

  useEffect(() => {
    if (amount && !isNaN(Number(amount))) {
      const amountValue = Number(amount);
      const { fee } = calculateFee(amountValue);
      setFeeAmount(fee);
    } else {
      setFeeAmount(0);
    }
  }, [amount]);

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
    if (isVerified || verificationAttempted) {
      setRecipientVerified(false);
      setRecipientName("");
      setRecipientId("");
      setRecipientData(null);
      setRecipientBalance(0);
      setVerificationAttempted(false);
      setWithdrawalSent(false);
    }
  };

  const processManualWithdrawal = async (verifiedRecipientData: any) => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      const amountValue = Number(amount);

      if (recipientBalance < amountValue) {
        toast({
          title: "Solde insuffisant",
          description: `Le client ${verifiedRecipientData.fullName} n'a que ${recipientBalance} FCFA. Montant demandé: ${amountValue} FCFA`,
          variant: "destructive"
        });
        return;
      }

      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      const { error: withdrawalError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: verifiedRecipientData.userId,
          amount: amountValue,
          withdrawal_phone: verifiedRecipientData.email,
          status: 'agent_pending',
          verification_code: verificationCode
        });

      if (withdrawalError) {
        console.error("Erreur lors de l'insertion du retrait:", withdrawalError);
        throw new Error(`Erreur lors de la création du retrait: ${withdrawalError.message}`);
      }

      setWithdrawalSent(true);

      toast({
        title: "Demande de retrait envoyée",
        description: `Une demande de retrait de ${amountValue} FCFA a été envoyée à ${verifiedRecipientData.fullName}. Code de confirmation: ${verificationCode}`,
      });

      console.log("Code de vérification généré:", verificationCode);

    } catch (error) {
      console.error("Erreur lors du traitement manuel du retrait:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors du retrait",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyRecipient = async () => {
    if (!isAgent() || !phoneNumber || phoneNumber.length < 6) return;
    
    setVerificationAttempted(true);
    
    console.log("=== DEBUT VERIFICATION ===");
    console.log("Numéro à vérifier:", phoneNumber);
    
    try {
      const result = await verifyRecipient(phoneNumber, countryCode, {
        fullName: "",
        email: phoneNumber,
        country: country || "Congo Brazzaville"
      });
      
      if (result.verified && result.recipientData?.userId) {
        console.log("✓ Utilisateur trouvé via useRecipientVerification:", result.recipientData);
        setRecipientId(result.recipientData.userId);
        setRecipientName(result.recipientData.fullName);
        setRecipientData(result.recipientData);
        setRecipientVerified(true);

        // Récupérer le solde actuel du client depuis la base de données
        const balanceData = await fetchUserBalance(result.recipientData.userId);
        setRecipientBalance(balanceData.balance);
        
        // 🔍 NOUVEAU: Lancer le diagnostic automatiquement
        console.log("🔎 Lancement du diagnostic pour l'utilisateur trouvé...");
        await analyzeUserById(result.recipientData.userId);
        
        toast({
          title: "Bénéficiaire trouvé",
          description: `${result.recipientData.fullName} a été trouvé. Solde: ${formatCurrency(balanceData.balance, currency)} (Diagnostic lancé - voir console)`
        });
        
      } else {
        console.log("✗ Aucun utilisateur trouvé via useRecipientVerification");
        toast({
          title: "Utilisateur non trouvé",
          description: "Impossible de trouver cet utilisateur dans la base de données",
          variant: "destructive"
        });
      }
      
    } catch (err) {
      console.error("Erreur lors de la vérification:", err);
      toast({
        title: "Erreur de vérification",
        description: "Une erreur s'est produite lors de la vérification du destinataire",
        variant: "destructive"
      });
    } finally {
      console.log("=== FIN VERIFICATION ===");
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

      const amountValue = Number(amount);
      
      if (isAgent()) {
        if (!isVerified || !recipientData) {
          toast({
            title: "Vérification requise",
            description: "Veuillez d'abord vérifier le destinataire",
            variant: "destructive"
          });
          return;
        }

        await processManualWithdrawal(recipientData);

        if (withdrawalSent) {
          setAmount("");
          setPhoneNumber("");
          setRecipientVerified(false);
          setRecipientName("");
          setRecipientId("");
          setRecipientData(null);
          setRecipientBalance(0);
          setVerificationAttempted(false);
          setWithdrawalSent(false);
          navigate('/dashboard');
        }

      } else {
        // Utilisateur normal: vérifier son propre solde avant de créer la demande
        if (userBalance < amountValue) {
          toast({
            title: "Solde insuffisant",
            description: `Votre solde actuel est de ${formatCurrency(userBalance, currency)}. Vous ne pouvez pas retirer ${formatCurrency(amountValue, currency)}.`,
            variant: "destructive"
          });
          return;
        }

        const formattedPhone = phoneNumber.startsWith('+') 
          ? phoneNumber 
          : `${countryCode}${phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber}`;
        
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
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

        setAmount("");
        setPhoneNumber("");
        navigate('/dashboard');
      }

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

  const isAmountExceedsBalance = isAgent() && isVerified && amount && Number(amount) > recipientBalance;
  const isUserAmountExceedsBalance = !isAgent() && amount && Number(amount) > userBalance;

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
                {/* Affichage du solde utilisateur pour les utilisateurs normaux */}
                {!isAgent() && (
                  <div className="px-3 py-2 bg-emerald-50 rounded-md text-sm border border-emerald-200">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Wallet className="w-4 h-4 mr-2 text-emerald-600" />
                        <span className="font-medium">Votre solde disponible:</span>
                      </div>
                      <span className={`font-bold ${userBalance > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isLoadingBalance ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                        ) : (
                          formatCurrency(userBalance, currency)
                        )}
                      </span>
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
                  {isAmountExceedsBalance && (
                    <div className="flex items-center text-red-600 text-sm mt-1">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      <span>Le montant dépasse le solde disponible du client ({formatCurrency(recipientBalance, currency)})</span>
                    </div>
                  )}
                  {isUserAmountExceedsBalance && (
                    <div className="flex items-center text-red-600 text-sm mt-1">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      <span>Le montant dépasse votre solde disponible ({formatCurrency(userBalance, currency)})</span>
                    </div>
                  )}
                </div>

                {isAgent() ? (
                  <>
                    <PhoneInput
                      phoneInput={phoneNumber}
                      countryCode={countryCode}
                      onPhoneChange={handlePhoneChange}
                      isLoading={isVerifying || isProcessing}
                      isVerified={isVerified}
                      recipientName={recipientName}
                      label="Numéro du client"
                      onBlurComplete={handleVerifyRecipient}
                    />
                    
                    {isVerified && recipientData && (
                      <div className="px-3 py-2 bg-blue-50 rounded-md text-sm border border-blue-200">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-2 text-blue-600" />
                            <span className="font-medium">Client vérifié:</span>
                          </div>
                          <span>{recipientName}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <div className="flex items-center">
                            <Wallet className="w-4 h-4 mr-2 text-blue-600" />
                            <span className="font-medium">Solde disponible:</span>
                          </div>
                          <span className={`font-bold ${recipientBalance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {isLoadingBalance ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                            ) : (
                              formatCurrency(recipientBalance, currency)
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </>
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
              
                {amount && Number(amount) > 0 && (
                  <div className="px-3 py-2 bg-gray-50 rounded-md text-sm">
                    <div className="flex justify-between">
                      <span>Montant:</span>
                      <span>{formatCurrency(Number(amount), currency)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Frais (2.5%):</span>
                      <span>{formatCurrency(feeAmount, currency)}</span>
                    </div>
                    <div className="border-t mt-2 pt-2 flex justify-between font-medium">
                      <span>Total:</span>
                      <span>{formatCurrency(Number(amount), currency)}</span>
                    </div>
                  </div>
                )}

                {withdrawalSent && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-800">
                    <p>✅ Demande de retrait envoyée avec succès!</p>
                    <p className="mt-1">Le client {recipientName} a reçu une notification pour confirmer le retrait.</p>
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
                  disabled={isProcessing || (isAgent() && (!isVerified || !recipientData || isAmountExceedsBalance)) || (!isAgent() && isUserAmountExceedsBalance)}
                >
                  {isProcessing ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span>Traitement en cours...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Banknote className="mr-2 h-5 w-5" />
                      <span>
                        {isAgent() 
                          ? "Envoyer la demande de retrait"
                          : "Continuer"
                        }
                      </span>
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
