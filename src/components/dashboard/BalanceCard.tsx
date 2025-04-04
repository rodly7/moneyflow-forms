
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency, getCurrencyForCountry } from "@/integrations/supabase/client";

interface BalanceCardProps {
  balance: number;
  avatar?: string;
  userName: string;
  userCountry: string;
  currency?: string;
}

const BalanceCard = ({ 
  balance, 
  avatar, 
  userName, 
  userCountry,
  currency
}: BalanceCardProps) => {
  // Get initials from user name
  const initials = userName
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // If currency is not provided, determine it from the user's country
  const userCurrency = currency || getCurrencyForCountry(userCountry);

  return (
    <Card className="mx-4 overflow-hidden border-0 shadow-lg relative bg-gradient-to-r from-emerald-500 to-teal-600">
      <CardContent className="p-6 text-white">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16 border-2 border-white/30 bg-white/10">
            <AvatarImage src={avatar} />
            <AvatarFallback className="bg-emerald-700 text-white text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-2 flex-grow">
            <h3 className="font-medium text-white/80 text-sm">
              Solde disponible
            </h3>
            
            <p className="text-3xl font-bold text-white truncate">
              {formatCurrency(balance, userCurrency)}
            </p>
            
            <div className="text-sm text-white/70 truncate">
              {userName} • {userCountry} • {userCurrency}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BalanceCard;
