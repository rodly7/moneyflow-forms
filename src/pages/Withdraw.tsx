
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { processWithdrawal } from "@/integrations/supabase/client";

const Withdraw = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

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

      await processWithdrawal(user.id, Number(amount), phoneNumber);

      toast({
        title: "Demande de retrait envoyée",
        description: `Votre demande de retrait de ${amount} XAF a été soumise et est en cours de traitement.`,
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
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="phone">Numéro de téléphone Mobile Money</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Ex: +242690485171"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">
                  Entrez le numéro qui recevra l'argent via Mobile Money
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Withdraw;
