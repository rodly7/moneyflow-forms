
import { useState, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, getCurrencyForCountry, convertCurrency } from "@/integrations/supabase/client";
import { Eye, EyeOff, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useRealTimeQuery } from "@/hooks/useOptimizedQuery";
import { useDebounce } from "@/hooks/usePerformanceOptimization";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { useWithdrawalConfirmation } from "@/hooks/useWithdrawalConfirmation";

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
  const [commissionDetails, setCommissionDetails] = useState<{
    agentCommission: number;
    moneyFlowCommission: number;
    totalFee: number;
  } | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { 
    verificationCode, 
    setVerificationCode, 
    isProcessing, 
    confirmWithdrawal 
  } = useWithdrawalConfirmation(() => setShowVerificationDialog(false));
  
  // Déterminer la devise basée sur le pays de l'utilisateur
  const userCurrency = currency || getCurrencyForCountry(userCountry);

  // Query optimisée pour récupérer le solde en temps réel
  const { data: realTimeBalance, isLoading: isLoadingBalance, refetch: refetchBalance } = useRealTimeQuery({
    queryKey: ['user-balance', user?.id],
    queryFn: async () => {
      if (!user?.id) return balance;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      return Number(data.balance) || 0;
    },
    enabled: !!user?.id,
  });

  // Utilise le solde en temps réel si disponible, sinon le solde passé en props
  const displayBalanceValue = realTimeBalance !== undefined ? realTimeBalance : balance;
  
  // Convertir le solde de XAF (devise de base) vers la devise de l'utilisateur
  const convertedBalance = convertCurrency(displayBalanceValue, "XAF", userCurrency);

  // Format the balance or display asterisks if hidden
  const displayBalance = showBalance 
    ? formatCurrency(convertedBalance, userCurrency)
    : "••••••";

  const handleRefreshBalance = useDebounce(async () => {
    try {
      await refetchBalance();
      toast({
        title: "Solde actualisé",
        description: "Le solde a été mis à jour avec succès"
      });
    } catch (error) {
      console.error("Erreur lors de l'actualisation:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'actualiser le solde",
        variant: "destructive"
      });
    }
  }, 1000);

  const handleVerifyWithdrawal = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Code incomplet",
        description: "Veuillez entrer le code à 6 chiffres complet",
        variant: "destructive"
      });
      return;
    }

    const result = await confirmWithdrawal(verificationCode);
    if (result.success && result.agentCommission !== undefined) {
      setCommissionDetails({
        agentCommission: result.agentCommission || 0,
        moneyFlowCommission: result.moneyFlowCommission || 0,
        totalFee: result.totalFee || 0
      });
    } else if (!result.success) {
      setVerificationCode("");
      toast({
        title: "Erreur",
        description: result.message || "Une erreur est survenue lors du traitement du retrait",
        variant: "destructive"
      });
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
              <h3 className="font-medium text-white/80 text-xs">
                Solde disponible
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleRefreshBalance}
                disabled={isLoadingBalance}
                className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
                aria-label="Actualiser le solde"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={() => setShowBalance(!showBalance)}
                className="text-white/80 hover:text-white transition-colors"
                aria-label={showBalance ? "Masquer le solde" : "Afficher le solde"}
              >
                {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-white">
              {isLoadingBalance ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span className="text-lg">Chargement...</span>
                </div>
              ) : (
                displayBalance
              )}
            </p>
          </div>
          
          {realTimeBalance !== undefined && realTimeBalance !== balance && (
            <p className="text-xs text-white/60 mt-1">
              Solde mis à jour en temps réel
            </p>
          )}
          
          {userCurrency !== "XAF" && (
            <p className="text-xs text-white/60 mt-1">
              Converti de {formatCurrency(displayBalanceValue, "XAF")}
            </p>
          )}
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
                    {formatCurrency(convertCurrency(commissionDetails.agentCommission, "XAF", userCurrency), userCurrency)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Commission MoneyFlow:</span>
                  <span className="font-medium">{formatCurrency(convertCurrency(commissionDetails.moneyFlowCommission, "XAF", userCurrency), userCurrency)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Frais totaux:</span>
                  <span className="font-bold">{formatCurrency(convertCurrency(commissionDetails.totalFee, "XAF", userCurrency), userCurrency)}</span>
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

export default memo(BalanceCard);
