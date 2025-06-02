import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase, calculateFee } from "@/integrations/supabase/client";
import { CheckCircle, XCircle } from "lucide-react";

interface WithdrawalConfirmationProps {
  onClose: () => void;
}

const WithdrawalConfirmation = ({ onClose }: WithdrawalConfirmationProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [verificationCode, setVerificationCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Code invalide",
        description: "Veuillez entrer un code de vérification à 6 chiffres",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour confirmer un retrait",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      // Find the withdrawal with this verification code for this user
      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('verification_code', verificationCode)
        .eq('user_id', user.id)
        .eq('status', 'agent_pending')
        .maybeSingle();

      if (withdrawalError) {
        console.error("Erreur lors de la recherche du retrait:", withdrawalError);
        throw new Error("Erreur de base de données lors de la vérification du code");
      }

      if (!withdrawalData) {
        throw new Error("Ce code de vérification n'existe pas ou a déjà été utilisé");
      }

      // Check user balance
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Erreur lors de la vérification du profil:", profileError);
        throw new Error("Impossible de vérifier votre solde");
      }

      if (!userProfile) {
        throw new Error("Profil utilisateur introuvable");
      }

      if (userProfile.balance < withdrawalData.amount) {
        throw new Error("Solde insuffisant pour effectuer ce retrait");
      }

      // Calculate fees using the calculateFee function
      const { fee, agentCommission, moneyFlowCommission } = calculateFee(withdrawalData.amount);

      // 1. Deduct amount from user account
      const { error: deductError } = await supabase.rpc('increment_balance', {
        user_id: user.id,
        amount: -(withdrawalData.amount)
      });

      if (deductError) {
        throw deductError;
      }

      // 2. Add amount (minus fees) + commission to agent account
      // We need to get agent_id from the withdrawal request first
      const { data: agentProfiles, error: agentError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'agent')
        .limit(1);

      if (agentError || !agentProfiles || agentProfiles.length === 0) {
        // Rollback user deduction
        await supabase.rpc('increment_balance', {
          user_id: user.id,
          amount: withdrawalData.amount
        });
        throw new Error("Aucun agent trouvé pour traiter le retrait");
      }

      const agentId = agentProfiles[0].id;
      const netAmount = withdrawalData.amount - fee + agentCommission;
      
      const { error: creditError } = await supabase.rpc('increment_balance', {
        user_id: agentId,
        amount: netAmount
      });

      if (creditError) {
        // Rollback user deduction if crediting agent fails
        await supabase.rpc('increment_balance', {
          user_id: user.id,
          amount: withdrawalData.amount
        });
        throw creditError;
      }
      
      // 3. Credit platform commission to admin account
      const { data: adminData, error: adminError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', '+221773637752')
        .maybeSingle();
        
      if (!adminError && adminData) {
        await supabase.rpc('increment_balance', {
          user_id: adminData.id,
          amount: moneyFlowCommission
        });
      }

      // 4. Update withdrawal status to completed
      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', withdrawalData.id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Retrait confirmé",
        description: `Votre retrait de ${withdrawalData.amount} FCFA a été confirmé et effectué par l'agent.`,
      });

      onClose();
    } catch (error) {
      console.error("Erreur lors de la confirmation du retrait:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur s'est produite lors de la confirmation du retrait",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Code invalide",
        description: "Veuillez entrer un code de vérification à 6 chiffres",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      // Update withdrawal status to rejected
      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('verification_code', verificationCode)
        .eq('user_id', user?.id)
        .eq('status', 'agent_pending');

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Retrait refusé",
        description: "Vous avez refusé cette demande de retrait.",
      });

      onClose();
    } catch (error) {
      console.error("Erreur lors du refus du retrait:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors du refus du retrait",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Confirmer le retrait</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="verificationCode">Code de vérification</Label>
          <Input
            id="verificationCode"
            type="text"
            placeholder="Entrez le code à 6 chiffres"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            maxLength={6}
            className="text-center text-lg"
          />
        </div>
        
        <div className="text-sm text-gray-600">
          <p>Un agent souhaite effectuer un retrait sur votre compte.</p>
          <p>Entrez le code de vérification pour confirmer ou refuser cette demande.</p>
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={handleConfirm}
            disabled={isProcessing || verificationCode.length !== 6}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Confirmer
          </Button>
          
          <Button
            onClick={handleReject}
            disabled={isProcessing || verificationCode.length !== 6}
            variant="destructive"
            className="flex-1"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Refuser
          </Button>
        </div>

        <Button
          onClick={onClose}
          variant="outline"
          className="w-full"
        >
          Annuler
        </Button>
      </CardContent>
    </Card>
  );
};

export default WithdrawalConfirmation;
