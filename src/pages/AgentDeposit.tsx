
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Banknote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AgentDeposit = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    recipientPhone: "",
    amount: "",
    description: ""
  });

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
    if (!formData.recipientPhone || !formData.amount) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez remplir tous les champs obligatoires",
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

    try {
      // Vérifier si l'agent a suffisamment de fonds
      const { data: agentProfile, error: agentProfileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (agentProfileError || !agentProfile) {
        throw new Error("Impossible de vérifier votre solde");
      }

      if (agentProfile.balance < amount) {
        throw new Error("Solde insuffisant pour effectuer ce dépôt");
      }

      // Vérifier si le bénéficiaire existe
      const { data: recipientProfile, error: recipientProfileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', formData.recipientPhone)
        .single();

      if (recipientProfileError) {
        throw new Error("Le numéro de téléphone du bénéficiaire n'existe pas");
      }

      // Procéder au dépôt sans frais (dépôt local)
      // 1. Déduire le montant du compte de l'agent
      const { error: deductError } = await supabase.rpc('increment_balance', {
        user_id: user.id,
        amount: -amount
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

      // 3. Enregistrer la transaction
      const { error: transactionError } = await supabase
        .from('recharges')
        .insert({
          user_id: recipientProfile.id,
          agent_id: user.id,
          amount: amount,
          payment_method: 'agent_deposit',
          payment_phone: formData.recipientPhone,
          description: formData.description || 'Dépôt par agent',
          status: 'completed'
        });

      if (transactionError) {
        throw transactionError;
      }

      // Notification de succès
      toast({
        title: "Dépôt effectué avec succès",
        description: `Le compte de ${formData.recipientPhone} a été crédité de ${amount} FCFA`,
      });

      // Réinitialiser le formulaire
      setFormData({
        recipientPhone: "",
        amount: "",
        description: ""
      });

      // Redirection vers la page d'accueil
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
            <CardDescription>
              Créditez directement le compte d'un utilisateur sans frais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipientPhone">Numéro du bénéficiaire</Label>
                <Input
                  id="recipientPhone"
                  name="recipientPhone"
                  placeholder="+237 6XX XXX XXX"
                  value={formData.recipientPhone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Montant du dépôt (FCFA)</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  placeholder="10000"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optionnel)</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="Dépôt Money Flow"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4"
                disabled={isProcessing}
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
