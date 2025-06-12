import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Banknote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PhoneInput from "@/components/transfer-steps/PhoneInput";
import { useRecipientVerification } from "@/hooks/useRecipientVerification";

const DepositForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    recipientPhone: "",
    amount: ""
  });
  const [countryCode, setCountryCode] = useState("+237");
  const [recipientName, setRecipientName] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [recipientBalance, setRecipientBalance] = useState<number | null>(null);
  const [verificationAttempted, setVerificationAttempted] = useState(false);

  const {
    isLoading: isVerifying,
    recipientVerified: isVerified,
    verifyRecipient,
    setRecipientVerified,
    getUserBalance
  } = useRecipientVerification();

  // Fetch agent profile to get their country
  useEffect(() => {
    const fetchAgentProfile = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('country')
          .eq('id', user.id)
          .single();
        
        if (!error && data?.country) {
          const countryToCodes: Record<string, string> = {
            "Cameroun": "+237",
            "Cameroon": "+237",
            "Congo Brazzaville": "+242",
            "Gabon": "+241",
            "Tchad": "+235",
            "Chad": "+235",
            "République Centrafricaine": "+236",
            "Central African Republic": "+236",
            "Guinée Équatoriale": "+240",
            "Equatorial Guinea": "+240",
            "Sénégal": "+221",
            "Nigeria": "+234",
            "Ghana": "+233",
          };
          
          const code = countryToCodes[data.country] || "+237";
          setCountryCode(code);
        }
      }
    };
    
    fetchAgentProfile();
  }, [user]);

  // Fonction pour récupérer le solde actualisé d'un utilisateur
  const fetchUserBalance = async (userId: string) => {
    try {
      console.log("🔄 Récupération du solde actualisé pour:", userId);
      
      // Forcer une nouvelle requête directe à la base de données
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('balance, full_name')
        .eq('id', userId)
        .single();
      
      if (!error && profile) {
        const actualBalance = Number(profile.balance) || 0;
        console.log("💰 Solde actualisé récupéré:", actualBalance);
        setRecipientBalance(actualBalance);
        return actualBalance;
      } else {
        console.error("❌ Erreur lors de la récupération du solde:", error);
        setRecipientBalance(0);
        return 0;
      }
    } catch (error) {
      console.error("❌ Erreur lors de la récupération du solde:", error);
      setRecipientBalance(0);
      return 0;
    }
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle phone number change
  const handlePhoneChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      recipientPhone: value
    }));
    if (isVerified || verificationAttempted) {
      setRecipientVerified(false);
      setRecipientName("");
      setRecipientId("");
      setRecipientBalance(null);
      setVerificationAttempted(false);
    }
  };

  // Verify recipient using the hook
  const handleVerifyRecipient = async () => {
    if (!formData.recipientPhone || formData.recipientPhone.length < 6) return;
    
    setVerificationAttempted(true);
    
    // Format the full phone number with country code
    const fullPhone = formData.recipientPhone.startsWith('+') 
      ? formData.recipientPhone 
      : `${countryCode}${formData.recipientPhone.startsWith('0') ? formData.recipientPhone.substring(1) : formData.recipientPhone}`;
    
    console.log("Verifying phone number:", fullPhone);
    
    try {
      const result = await verifyRecipient(fullPhone, countryCode, {
        fullName: "",
        email: fullPhone,
        country: ""
      });
      
      if (result.verified && result.recipientData) {
        console.log("Verification result:", result);
        setRecipientName(result.recipientData.fullName);
        
        if (result.recipientData.userId) {
          setRecipientId(result.recipientData.userId);
          setRecipientVerified(true);
          
          // Récupérer le solde actualisé
          const actualBalance = await fetchUserBalance(result.recipientData.userId);
          
          // Afficher un toast avec les informations complètes
          toast({
            title: "Utilisateur trouvé",
            description: `${result.recipientData.fullName} - Solde exact: ${actualBalance} FCFA`
          });
          return;
        }
      } else {
        toast({
          title: "Utilisateur non trouvé",
          description: "Ce numéro n'existe pas dans notre base de données",
          variant: "destructive"
        });
        setRecipientVerified(false);
        setRecipientName("");
        setRecipientId("");
        setRecipientBalance(null);
      }
    } catch (err) {
      console.error("Error checking recipient:", err);
      toast({
        title: "Erreur de vérification",
        description: "Une erreur s'est produite lors de la vérification de l'utilisateur",
        variant: "destructive"
      });
      setRecipientVerified(false);
      setRecipientName("");
      setRecipientId("");
      setRecipientBalance(null);
    }
  };

  // Verify recipient automatically as they type
  useEffect(() => {
    if (formData.recipientPhone && formData.recipientPhone.length >= 8) {
      const delayDebounceFn = setTimeout(() => {
        handleVerifyRecipient();
      }, 500);
      
      return () => clearTimeout(delayDebounceFn);
    }
  }, [formData.recipientPhone, countryCode]);

  // Handle deposit submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour effectuer un dépôt",
        variant: "destructive"
      });
      return;
    }

    if (!formData.recipientPhone || !formData.amount || !recipientId) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez remplir tous les champs et vérifier l'utilisateur",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Montant invalide",
        description: "Le montant doit être un nombre positif",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    const fullPhone = formData.recipientPhone.startsWith('+') 
      ? formData.recipientPhone 
      : `${countryCode}${formData.recipientPhone.startsWith('0') ? formData.recipientPhone.substring(1) : formData.recipientPhone}`;

    try {
      const { data: agentProfile, error: agentProfileError } = await supabase
        .from('profiles')
        .select('balance, country')
        .eq('id', user.id)
        .single();

      if (agentProfileError || !agentProfile) {
        throw new Error("Impossible de vérifier votre solde");
      }

      if (agentProfile.balance < amount) {
        throw new Error("Solde insuffisant pour effectuer ce dépôt");
      }

      const agentCommission = amount * 0.005;
      const transactionReference = `DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const { error: deductError } = await supabase.rpc('increment_balance', {
        user_id: user.id,
        amount: -(amount)
      });

      if (deductError) {
        throw new Error("Erreur lors de la déduction du montant de votre compte");
      }

      const { error: creditError } = await supabase.rpc('increment_balance', {
        user_id: recipientId,
        amount: amount
      });

      if (creditError) {
        await supabase.rpc('increment_balance', {
          user_id: user.id,
          amount: amount
        });
        throw new Error("Erreur lors du crédit du compte de l'utilisateur");
      }
      
      const { error: commissionError } = await supabase.rpc('increment_balance', {
        user_id: user.id,
        amount: agentCommission
      });
      
      if (commissionError) {
        console.error("Erreur lors du crédit de la commission à l'agent:", commissionError);
      }

      const { error: transactionError } = await supabase
        .from('recharges')
        .insert({
          user_id: recipientId,
          amount: amount,
          country: agentProfile.country || "Cameroun",
          payment_method: 'agent_deposit',
          payment_phone: fullPhone,
          payment_provider: 'agent',
          transaction_reference: transactionReference,
          status: 'completed',
          provider_transaction_id: user.id
        });

      if (transactionError) {
        console.error('Erreur transaction:', transactionError);
      }

      // Calculer le nouveau solde du destinataire
      const newRecipientBalance = (recipientBalance || 0) + amount;

      toast({
        title: "Dépôt effectué avec succès",
        description: `Le compte de ${recipientName} a été crédité de ${amount} FCFA. Nouveau solde: ${newRecipientBalance} FCFA. Votre commission: ${agentCommission.toFixed(0)} FCFA`,
      });

      setFormData({
        recipientPhone: "",
        amount: ""
      });
      setRecipientVerified(false);
      setRecipientName("");
      setRecipientId("");
      setRecipientBalance(null);

      navigate('/');
    } catch (error) {
      console.error('Erreur lors du dépôt:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors du dépôt",
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
          <Button variant="ghost" onClick={() => navigate('/')} className="text-gray-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Dépôt</h1>
          <div className="w-10"></div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Effectuer un dépôt</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <PhoneInput
                phoneInput={formData.recipientPhone}
                countryCode={countryCode}
                onPhoneChange={handlePhoneChange}
                isLoading={isVerifying}
                isVerified={isVerified}
                recipientName={recipientName}
                label="Numéro de téléphone de l'utilisateur"
                onBlurComplete={handleVerifyRecipient}
              />

              {isVerified && recipientBalance !== null && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex flex-col space-y-2">
                    <p className="text-sm text-green-700">
                      <strong>Nom:</strong> {recipientName}
                    </p>
                    <p className="text-lg font-semibold text-green-800">
                      <strong>Solde exact:</strong> {recipientBalance} FCFA
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  placeholder="Montant du dépôt (FCFA)"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  className="h-12 text-lg"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4 h-12 text-lg"
                disabled={isProcessing || !recipientId}
              >
                {isProcessing ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span>Traitement en cours...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Banknote className="mr-2 h-5 w-5" />
                    <span>Effectuer le dépôt</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DepositForm;
