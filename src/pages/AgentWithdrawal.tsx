
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Banknote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PhoneInput from "@/components/transfer-steps/PhoneInput";
import { useQuery } from "@tanstack/react-query";
import { useRecipientVerification } from "@/hooks/useRecipientVerification";

const AgentWithdrawal = () => {
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
  const [verificationAttempted, setVerificationAttempted] = useState(false);

  const {
    isLoading: isVerifying,
    recipientVerified: isVerified,
    verifyRecipient,
    setRecipientVerified
  } = useRecipientVerification();

  // Get agent profile
  const { data: agentProfile } = useQuery({
    queryKey: ['agent-profile'],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('country, balance')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Update country code based on agent's country
  useState(() => {
    if (agentProfile?.country) {
      const countryToCodes = {
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
      
      const code = countryToCodes[agentProfile.country as keyof typeof countryToCodes] || "+237";
      setCountryCode(code);
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhoneChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      recipientPhone: value
    }));
    if (isVerified || verificationAttempted) {
      setRecipientVerified(false);
      setRecipientName("");
      setRecipientId("");
      setVerificationAttempted(false);
    }
  };

  const handleVerifyRecipient = async () => {
    if (!formData.recipientPhone || formData.recipientPhone.length < 6) return;
    
    setVerificationAttempted(true);
    
    const fullPhone = formData.recipientPhone.startsWith('+') 
      ? formData.recipientPhone 
      : `${countryCode}${formData.recipientPhone.startsWith('0') ? formData.recipientPhone.substring(1) : formData.recipientPhone}`;
    
    console.log("Vérification pour le numéro complet:", fullPhone);
    
    try {
      const result = await verifyRecipient(fullPhone, countryCode, {
        fullName: "",
        email: fullPhone,
        country: agentProfile?.country || "Cameroun"
      });
      
      if (result.verified && result.recipientData) {
        console.log("Résultat de la vérification:", result);
        setRecipientName(result.recipientData.fullName);
        
        if (result.recipientData.userId) {
          setRecipientId(result.recipientData.userId);
          console.log("ID utilisateur directement récupéré:", result.recipientData.userId);
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
          .select('id')
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
            .select('id, phone');
          
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
      } else {
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
      setRecipientVerified(false);
      setRecipientName("");
      setRecipientId("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour effectuer un retrait",
        variant: "destructive"
      });
      return;
    }

    if (!formData.recipientPhone || !formData.amount || !recipientId) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez remplir tous les champs obligatoires et vérifier le bénéficiaire",
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
      // Vérifier le solde du client AVANT de créer la demande
      const { data: clientProfile, error: clientProfileError } = await supabase
        .from('profiles')
        .select('balance, country')
        .eq('id', recipientId)
        .single();

      if (clientProfileError) {
        throw new Error("Impossible de vérifier le solde du client");
      }

      if (!clientProfile) {
        throw new Error("Profil client introuvable");
      }

      console.log("Solde du client:", clientProfile.balance, "Montant demandé:", amount);

      if (clientProfile.balance < amount) {
        toast({
          title: "Solde insuffisant",
          description: `Le client n'a que ${clientProfile.balance} FCFA dans son compte. Montant demandé: ${amount} FCFA`,
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      // Générer un code de vérification pour la confirmation du client
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Créer la demande de retrait en attente de confirmation du client
      const { error: withdrawalError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: recipientId,
          amount: amount,
          withdrawal_phone: fullPhone,
          status: 'agent_pending',
          verification_code: verificationCode
        });

      if (withdrawalError) {
        throw withdrawalError;
      }

      toast({
        title: "Demande de retrait envoyée",
        description: `Une demande de retrait de ${amount} FCFA a été envoyée à ${recipientName}. Code de vérification: ${verificationCode}`,
      });

      // Réinitialiser le formulaire
      setFormData({
        recipientPhone: "",
        amount: ""
      });
      setRecipientVerified(false);
      setRecipientName("");
      setRecipientId("");

      // Redirection vers la page d'accueil
      navigate('/dashboard');
    } catch (error) {
      console.error('Erreur lors du retrait:', error);
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
            <CardTitle>Effectuer un retrait</CardTitle>
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
                label="Numéro du client"
                onBlurComplete={handleVerifyRecipient}
              />

              <div className="space-y-2">
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  placeholder="Montant du retrait (FCFA)"
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
                    <span>Vérification du solde...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Banknote className="mr-2 h-5 w-5" />
                    <span>Envoyer la demande</span>
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

export default AgentWithdrawal;
