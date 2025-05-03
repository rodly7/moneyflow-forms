
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, getCurrencyForCountry } from "@/integrations/supabase/client";
import { Eye, EyeOff, Key, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { useTransferForm } from "@/hooks/useTransferForm";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface BalanceCardProps {
  balance: number;
  userCountry: string;
  currency?: string;
}

const BalanceCard = ({ 
  balance, 
  userCountry,
  currency
}: BalanceCardProps) => {
  const [showBalance, setShowBalance] = useState(false);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [commissionDetails, setCommissionDetails] = useState<{
    agentCommission: number;
    moneyFlowCommission: number;
    totalFee: number;
  } | null>(null);
  const navigate = useNavigate();
  const { confirmWithdrawal } = useTransferForm();
  const { toast } = useToast();
  const { isAgent } = useAuth();
  
  // If currency is not provided, determine it from the user's country
  const userCurrency = currency || getCurrencyForCountry(userCountry);

  // Format the balance or display asterisks if hidden
  const displayBalance = showBalance 
    ? formatCurrency(balance, userCurrency)
    : "••••••";

  const handleVerifyWithdrawal = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Code incomplet",
        description: "Veuillez entrer le code à 6 chiffres complet",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const result = await confirmWithdrawal(verificationCode);
      if (result.success) {
        setCommissionDetails({
          agentCommission: result.agentCommission || 0,
          moneyFlowCommission: result.moneyFlowCommission || 0,
          totalFee: result.totalFee || 0
        });
        // Ne pas fermer le dialogue immédiatement, afficher les détails de commission
      } else {
        setVerificationCode("");
        toast({
          title: "Erreur",
          description: result.message || "Une erreur est survenue lors du traitement du retrait",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du traitement du retrait",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const closeDialog = () => {
    setShowVerificationDialog(false);
    setVerificationCode("");
    setCommissionDetails(null);
  };

  return (
    <>
      <Card className="mx-4 overflow-hidden border-0 shadow-lg relative bg-gradient-to-r from-emerald-500 to-teal-600">
        <CardContent className="p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-white/80" />
              <h3 className="font-medium text-white/80 text-xs">
                Solde disponible
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowBalance(!showBalance)}
                className="text-white/80 hover:text-white transition-colors"
                aria-label={showBalance ? "Masquer le solde" : "Afficher le solde"}
              >
                {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>

              {isAgent() && (
                <button 
                  onClick={() => setShowVerificationDialog(true)}
                  className="text-white/80 hover:text-white transition-colors ml-2"
                  aria-label="Confirmer un retrait"
                >
                  <Key size={16} />
                </button>
              )}
            </div>
          </div>
          
          <p className="text-2xl font-bold text-white">
            {displayBalance}
          </p>
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {commissionDetails ? "Retrait confirmé" : "Confirmer un retrait"}
            </DialogTitle>
            <DialogDescription>
              {commissionDetails 
                ? "Le retrait a été traité avec succès" 
                : "Entrez le code à 6 chiffres fourni par la personne qui demande le retrait"
              }
            </DialogDescription>
          </DialogHeader>
          
          {commissionDetails ? (
            <div className="p-4">
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Votre commission:</span>
                  <span className="font-medium text-emerald-600">
                    {formatCurrency(commissionDetails.agentCommission, userCurrency)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Commission MoneyFlow:</span>
                  <span className="font-medium">{formatCurrency(commissionDetails.moneyFlowCommission, userCurrency)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Frais totaux:</span>
                  <span className="font-bold">{formatCurrency(commissionDetails.totalFee, userCurrency)}</span>
                </div>
              </div>
              
              <Button 
                onClick={closeDialog} 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                Fermer
              </Button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <InputOTP 
                maxLength={6} 
                value={verificationCode} 
                onChange={setVerificationCode}
                render={({ slots }) => (
                  <InputOTPGroup>
                    {slots.map((slot, i) => (
                      <InputOTPSlot key={i} {...slot} index={i} />
                    ))}
                  </InputOTPGroup>
                )}
                disabled={isProcessing}
              />
              
              <div className="flex gap-2 justify-end mt-4">
                <Button variant="outline" onClick={closeDialog} disabled={isProcessing}>
                  Annuler
                </Button>
                <Button 
                  onClick={handleVerifyWithdrawal} 
                  disabled={verificationCode.length !== 6 || isProcessing}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isProcessing ? "Vérification..." : "Confirmer le retrait"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BalanceCard;
