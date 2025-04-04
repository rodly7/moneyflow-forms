
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, getCurrencyForCountry } from "@/integrations/supabase/client";

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
  // If currency is not provided, determine it from the user's country
  const userCurrency = currency || getCurrencyForCountry(userCountry);

  return (
    <Card className="mx-4 overflow-hidden border-0 shadow-lg relative bg-gradient-to-r from-emerald-500 to-teal-600">
      <CardContent className="p-6 text-white">
        <div className="space-y-3">
          <h3 className="font-medium text-white/80 text-sm">
            Solde disponible
          </h3>
          
          <p className="text-3xl font-bold text-white">
            {formatCurrency(balance, userCurrency)}
          </p>
          
          <div className="text-sm text-white/70">
            {userCountry} • {userCurrency}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BalanceCard;
