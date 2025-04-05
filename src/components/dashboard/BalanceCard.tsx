
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, getCurrencyForCountry } from "@/integrations/supabase/client";
import { Eye, EyeOff, Wallet, Key } from "lucide-react";

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
  
  // If currency is not provided, determine it from the user's country
  const userCurrency = currency || getCurrencyForCountry(userCountry);

  // Format the balance or display asterisks if hidden
  const displayBalance = showBalance 
    ? formatCurrency(balance, userCurrency)
    : "••••••";

  return (
    <Card className="mx-4 overflow-hidden border-0 shadow-lg relative bg-gradient-to-r from-emerald-500 to-teal-600">
      <CardContent className="p-6 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-white/80" />
            <h3 className="font-medium text-white/80 text-xs">
              Solde disponible
            </h3>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Clé de retrait"
            >
              <Key size={16} className="text-white/80" />
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
        
        <p className="text-2xl font-bold text-white">
          {displayBalance}
        </p>
      </CardContent>
    </Card>
  );
};

export default BalanceCard;
