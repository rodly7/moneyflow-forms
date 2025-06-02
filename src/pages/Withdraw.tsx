
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Banknote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase, formatCurrency, getCurrencyForCountry, calculateFee } from "@/integrations/supabase/client";
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
      setVerificationAttempted(false);
    }
  };

  const handleVerifyRecipient = async () => {
    if (!isAgent() || !phoneNumber || phoneNumber.length < 6) return;
    
    setVerificationAttempted(true);
    
    const fullPhone = phoneNumber.startsWith('+') 
      ? phoneNumber 
      : `${countryCode}${phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber}`;
    
    console.log("=== DEBUT VERIFICATION ===");
    console.log("Numéro à vérifier:", fullPhone);
    
    try {
      const result = await verifyRecipient(fullPhone, countryCode, {
        fullName: "",
        email: fullPhone,
        country: country || "Cameroun"
      });
      
      console.log("Résultat de verifyRecipient:", result);
      
      if (result.verified && result.recipientData) {
        console.log("✓ Vérification réussie via hook");
        setRecipientName(result.recipientData.fullName);
        
        if (result.recipientData.userId) {
          console.log("✓ ID trouvé dans recipientData:", result.recipientData.userId);
          setRecipientId(result.recipientData.userId);
          setRecipientVerified(true);
          toast({
            title: "Bénéficiaire trouvé",
            description: `${result.recipientData.fullName} a été trouvé dans la base de données`
          });
          console.log("=== FIN VERIFICATION ===");
          console.log("recipientId final:", result.recipientData.userId);
          console.log("isVerified final:", true);
          return;
        }
      }
      
      console.log("✗ Aucun utilisateur trouvé via le hook, recherche manuelle...");
      
      // Recherche manuelle directe par téléphone
      const { data: profileByPhone, error: phoneError } = await supabase
        .from('profiles')
        .select('id, full_name, balance')
        .eq('phone', fullPhone)
        .maybeSingle();
      
      console.log("Recherche directe par téléphone:", { data: profileByPhone, error: phoneError });
      
      if (!phoneError && profileByPhone) {
        console.log("✓ Utilisateur trouvé par recherche directe:", profileByPhone);
        setRecipientId(profileByPhone.id);
        setRecipientName(profileByPhone.full_name || "Utilisateur");
        setRecipientVerified(true);
        toast({
          title: "Bénéficiaire trouvé",
          description: `${profileByPhone.full_name || "Utilisateur"} a été trouvé dans la base de données`
        });
        console.log("=== FIN VERIFICATION ===");
        console.log("recipientId final:", profileByPhone.id);
        console.log("isVerified final:", true);
        return;
      }
      
      // Recherche par les 8 derniers chiffres
      console.log("Recherche par les 8 derniers chiffres...");
      const lastDigits = fullPhone.replace(/\D/g, '').slice(-8);
      
      if (lastDigits.length >= 8) {
        const { data: allProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, phone, full_name, balance');
        
        console.log(`Recherche dans ${allProfiles?.length || 0} profils pour les chiffres:`, lastDigits);
        
        if (!profilesError && allProfiles) {
          const matchingProfile = allProfiles.find(profile => {
            if (!profile.phone) return false;
            const profileLastDigits = profile.phone.replace(/\D/g, '').slice(-8);
            const match = profileLastDigits === lastDigits;
            if (match) {
              console.log("✓ Correspondance trouvée:", profile);
            }
            return match;
          });
          
          if (matchingProfile) {
            setRecipientId(matchingProfile.id);
            setRecipientName(matchingProfile.full_name || "Utilisateur");
            setRecipientVerified(true);
            console.log("✓ ID défini via derniers chiffres:", matchingProfile.id);
            toast({
              title: "Bénéficiaire trouvé",
              description: `${matchingProfile.full_name || "Utilisateur"} a été trouvé dans la base de données`
            });
            console.log("=== FIN VERIFICATION ===");
            console.log("recipientId final:", matchingProfile.id);
            console.log("isVerified final:", true);
            return;
          }
        }
      }
      
      console.log("✗ Aucun utilisateur trouvé");
      toast({
        title: "Utilisateur non trouvé",
        description: "Impossible de trouver cet utilisateur dans la base de données",
        variant: "destructive"
      });
      
    } catch (err) {
      console.error("Erreur lors de la vérification:", err);
      toast({
        title: "Erreur de vérification",
        description: "Une erreur s'est produite lors de la vérification du destinataire",
        variant: "destructive"
      });
    } finally {
      console.log("=== FIN VERIFICATION ===");
      console.log("recipientId final:", recipientId);
      console.log("isVerified final:", isVerified);
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
        // VÉRIFICATION STRICTE: S'assurer que l'agent a un recipientId valide
        if (!recipientId) {
          console.error("ERREUR: recipientId manquant pour l'agent");
          console.log("Debug values:", { recipientId, isVerified, recipientName });
          throw new Error("Veuillez d'abord vérifier le client en utilisant son numéro de téléphone.");
        }
        
        console.log("Agent - Traitement du retrait avec recipientId:", recipientId);
        
        // CORRECTION: Utiliser une approche plus robuste pour vérifier le profil client
        // Essayer plusieurs méthodes pour s'assurer que l'utilisateur existe
        
        // Méthode 1: Recherche directe par ID
        let clientProfile = null;
        let profileError = null;

        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, balance, full_name, country, phone')
            .eq('id', recipientId)
            .single();
          
          clientProfile = data;
          profileError = error;
          console.log("Recherche par ID - Résultat:", { data, error });
        } catch (err) {
          console.log("Erreur lors de la recherche par ID:", err);
        }

        // Méthode 2: Si la recherche par ID échoue, rechercher par téléphone
        if (!clientProfile) {
          console.log("Recherche par téléphone en fallback...");
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('id, balance, full_name, country, phone')
              .eq('phone', formattedPhone)
              .single();
            
            if (!error && data) {
              clientProfile = data;
              setRecipientId(data.id); // Mettre à jour l'ID avec celui trouvé
              console.log("Client trouvé par téléphone:", data);
            }
          } catch (err) {
            console.log("Erreur lors de la recherche par téléphone:", err);
          }
        }

        // Méthode 3: Recherche dans tous les profils par les derniers chiffres
        if (!clientProfile) {
          console.log("Recherche par derniers chiffres en fallback...");
          const lastDigits = formattedPhone.replace(/\D/g, '').slice(-8);
          
          try {
            const { data: allProfiles, error } = await supabase
              .from('profiles')
              .select('id, balance, full_name, country, phone');
            
            if (!error && allProfiles) {
              const matchingProfile = allProfiles.find(profile => {
                if (!profile.phone) return false;
                const profileLastDigits = profile.phone.replace(/\D/g, '').slice(-8);
                return profileLastDigits === lastDigits;
              });
              
              if (matchingProfile) {
                clientProfile = matchingProfile;
                setRecipientId(matchingProfile.id); // Mettre à jour l'ID
                console.log("Client trouvé par derniers chiffres:", matchingProfile);
              }
            }
          } catch (err) {
            console.log("Erreur lors de la recherche par derniers chiffres:", err);
          }
        }

        if (!clientProfile) {
          console.error("AUCUN PROFIL CLIENT TROUVÉ après toutes les tentatives");
          throw new Error("Client introuvable dans la base de données. Veuillez vérifier que le numéro est correct.");
        }

        console.log("Profil client final validé:", clientProfile);

        // Vérifier le solde du client
        if (clientProfile.balance < amountValue) {
          throw new Error(`Solde insuffisant. Client ${clientProfile.full_name || 'inconnu'} a ${clientProfile.balance} FCFA, montant demandé: ${amountValue} FCFA`);
        }

        // Générer un code de vérification pour la confirmation du client
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Créer la demande de retrait en attente de confirmation
        const { error: withdrawalError } = await supabase
          .from('withdrawals')
          .insert({
            user_id: clientProfile.id, // Utiliser l'ID du profil trouvé
            amount: amountValue,
            withdrawal_phone: formattedPhone,
            status: 'agent_pending',
            verification_code: verificationCode
          });

        if (withdrawalError) {
          console.error("Erreur lors de l'insertion du retrait:", withdrawalError);
          throw new Error(`Erreur lors de la création du retrait: ${withdrawalError.message}`);
        }

        toast({
          title: "Demande de retrait envoyée",
          description: `Une demande de retrait de ${amountValue} FCFA a été envoyée à ${clientProfile.full_name}. Code: ${verificationCode}`,
        });

      } else {
        // Utilisateur normal demandant un retrait
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
      }
      
      setAmount("");
      setPhoneNumber("");
      setRecipientVerified(false);
      setRecipientName("");
      setRecipientId("");
      setVerificationAttempted(false);
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
                      <span>Frais (2.5%):</span>
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
                      <span>Vérification en cours...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Banknote className="mr-2 h-5 w-5" />
                      <span>{isAgent() ? "Envoyer la demande" : "Continuer"}</span>
                    </div>
                  )}
                </Button>
                
                {/* Debug info for agents */}
                {isAgent() && (
                  <div className="text-xs text-gray-500 mt-2 space-y-1">
                    <div>Debug: recipientId = {recipientId || "non défini"}</div>
                    <div>isVerified = {isVerified ? "oui" : "non"}</div>
                    <div>recipientName = {recipientName || "non défini"}</div>
                  </div>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Withdraw;
