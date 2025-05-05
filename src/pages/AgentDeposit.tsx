
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
import { useQuery } from "@tanstack/react-query";
import { useRecipientVerification } from "@/hooks/useRecipientVerification";

const AgentDeposit = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    recipientPhone: "",
    amount: ""
  });
  const [countryCode, setCountryCode] = useState("+237"); // Défaut à Cameroun
  const [recipientName, setRecipientName] = useState("");
  const [recipientId, setRecipientId] = useState("");

  // Utiliser le hook useRecipientVerification pour la recherche des utilisateurs
  const {
    isLoading: isVerifying,
    recipientVerified: isVerified,
    verifyRecipient,
    setRecipientVerified
  } = useRecipientVerification();

  // Récupérer le profil de l'agent pour obtenir son pays
  const { data: agentProfile } = useQuery({
    queryKey: ['agent-profile'],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('country')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Mettre à jour le code pays en fonction du pays de l'agent
  useEffect(() => {
    if (agentProfile?.country) {
      // Mapper le pays vers le code de pays approprié
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
      
      const code = countryToCodes[agentProfile.country] || "+237";
      setCountryCode(code);
    }
  }, [agentProfile]);

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
    // Reset verification if phone changes
    setRecipientVerified(false);
    setRecipientName("");
    setRecipientId("");
  };

  // Verify recipient using the hook
  const handleVerifyRecipient = async () => {
    if (!formData.recipientPhone || formData.recipientPhone.length < 6) return;
    
    // Formatage du numéro complet avec l'indicatif pays
    const fullPhone = countryCode + formData.recipientPhone;
    
    try {
      const result = await verifyRecipient(fullPhone, countryCode, {
        fullName: "",
        email: fullPhone,
        country: agentProfile?.country || "Cameroun"
      });
      
      if (result.verified && result.recipientData) {
        setRecipientName(result.recipientData.fullName);
        
        // Chercher l'ID utilisateur dans la base de données
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('phone', fullPhone)
          .single();
        
        if (!error && profile) {
          setRecipientId(profile.id);
          toast({
            title: "Bénéficiaire trouvé",
            description: `${result.recipientData.fullName} a été trouvé dans la base de données`
          });
        } else {
          toast({
            title: "Erreur de récupération",
            description: "L'ID utilisateur n'a pas pu être récupéré",
            variant: "destructive"
          });
          setRecipientVerified(false);
        }
      } else if (result.recipientData) {
        // Destinataire trouvé dans le système mais pas vérifié (nouvel utilisateur)
        setRecipientName(result.recipientData.fullName || fullPhone);
        toast({
          title: "Nouveau bénéficiaire",
          description: "Cette personne n'est pas encore inscrite dans le système",
          variant: "destructive"
        });
        setRecipientVerified(false);
      } else {
        toast({
          title: "Destinataire introuvable",
          description: "Aucun compte associé à ce numéro",
          variant: "destructive"
        });
        setRecipientVerified(false);
        setRecipientName("");
        setRecipientId("");
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

    // Basic validation
    if (!formData.recipientPhone || !formData.amount || !isVerified || !recipientId) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez remplir tous les champs obligatoires et vérifier le bénéficiaire",
        variant: "destructive"
      });
      return;
    }

    // Convert amount to number
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
    const fullPhone = countryCode + formData.recipientPhone;

    try {
      // Vérifier si l'agent a suffisamment de fonds
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

      // Vérifier si le bénéficiaire existe (encore une fois par sécurité)
      const { data: recipientProfile, error: recipientProfileError } = await supabase
        .from('profiles')
        .select('id, country')
        .eq('id', recipientId)
        .single();

      if (recipientProfileError) {
        throw new Error("Le bénéficiaire n'existe pas ou n'est plus accessible");
      }

      // Calculer une commission de 0.5% pour l'agent
      const agentCommission = amount * 0.005;
      
      // Generate a unique transaction reference
      const transactionReference = `DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // 1. Déduire le montant du compte de l'agent
      const { error: deductError } = await supabase.rpc('increment_balance', {
        user_id: user.id,
        amount: -(amount)  // On déduit le montant total
      });

      if (deductError) {
        throw deductError;
      }

      // 2. Ajouter le montant au compte du bénéficiaire
      const { error: creditError } = await supabase.rpc('increment_balance', {
        user_id: recipientProfile.id,
        amount: amount
      });

      if (creditError) {
        throw creditError;
      }
      
      // 3. Recrediter la commission à l'agent
      const { error: commissionError } = await supabase.rpc('increment_balance', {
        user_id: user.id,
        amount: agentCommission
      });
      
      if (commissionError) {
        console.error("Erreur lors du crédit de la commission à l'agent:", commissionError);
        // On continue même en cas d'erreur pour ne pas bloquer la transaction
      }

      // 4. Enregistrer la transaction dans la table recharges
      const { error: transactionError } = await supabase
        .from('recharges')
        .insert({
          user_id: recipientProfile.id,
          amount: amount,
          country: recipientProfile.country || "Cameroun",
          payment_method: 'agent_deposit',
          payment_phone: fullPhone,
          payment_provider: 'agent',
          transaction_reference: transactionReference,
          status: 'completed',
          provider_transaction_id: user.id,
          agent_commission: agentCommission
        });

      if (transactionError) {
        throw transactionError;
      }

      // Notification de succès
      toast({
        title: "Dépôt effectué avec succès",
        description: `Le compte de ${recipientName} a été crédité de ${amount} FCFA. Votre commission: ${agentCommission} FCFA`,
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
      navigate('/agent');
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
          <Button variant="ghost" onClick={() => navigate('/agent')} className="text-gray-700">
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
                label="Numéro du bénéficiaire"
                onBlurComplete={handleVerifyRecipient}
              />

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
                disabled={isProcessing || !isVerified}
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

export default AgentDeposit;
