
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Wallet, KeyRound } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, processWithdrawalVerification, getCurrencyForCountry, formatCurrency } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface BalanceCardProps {
  balance: number;
  avatar?: string;
  userName: string;
  userCountry?: string;
}

const BalanceCard = ({ balance, avatar, userName, userCountry = "Cameroun" }: BalanceCardProps) => {
  const [hideBalance, setHideBalance] = useState(true);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Determine user's currency based on country
  const userCurrency = getCurrencyForCountry(userCountry);

  const handleVerifyWithdrawal = async () => {
    if (!verificationCode || verificationCode.length !== 6 || !user?.id) return;
    
    setProcessing(true);
    
    try {
      const withdrawal = await processWithdrawalVerification(verificationCode, user.id);
      
      toast({
        title: "Retrait confirmé",
        description: `Vous avez reçu ${formatCurrency(withdrawal.amount, userCurrency)}`,
      });
      
      // Refresh user data to show updated balance
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Close dialog
      setTimeout(() => {
        setShowVerificationDialog(false);
        setVerificationCode("");
      }, 1500);
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="bg-gradient-to-r from-emerald-500 to-emerald-700 text-white mx-4">
      <CardContent className="p-4 sm:p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm opacity-80">Solde disponible</p>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1 flex items-center">
              {hideBalance ? (
                "••••••"
              ) : (
                formatCurrency(balance || 0, userCurrency)
              )}
              <Button
                onClick={() => setHideBalance(!hideBalance)}
                variant="ghost"
                size="icon"
                className="ml-2 text-white/80 hover:text-white hover:bg-white/10"
              >
                {hideBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Wallet className="w-10 h-10 opacity-80" />
            <Button
              onClick={() => setShowVerificationDialog(true)}
              variant="ghost" 
              size="sm"
              className="text-white/90 hover:text-white hover:bg-white/10 rounded-full p-2 h-auto"
            >
              <KeyRound className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Verification Code Input Dialog */}
      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer un retrait</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4 space-y-4">
            <p className="text-center text-sm text-gray-600 mb-2">
              Entrez le code de vérification à 6 chiffres fourni par la personne qui effectue le retrait
            </p>
            
            <div className="w-full space-y-2">
              <Label htmlFor="verification-code">Code de vérification</Label>
              <Input
                id="verification-code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Entrez le code à 6 chiffres"
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </div>
            
            <Button
              onClick={handleVerifyWithdrawal}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={processing || verificationCode.length !== 6}
            >
              {processing ? "Traitement..." : "Confirmer le retrait"}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                setShowVerificationDialog(false);
                setVerificationCode("");
              }}
              className="w-full"
              disabled={processing}
            >
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default BalanceCard;
