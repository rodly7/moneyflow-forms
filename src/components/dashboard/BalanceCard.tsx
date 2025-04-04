
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency } from "@/integrations/supabase/client";

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
  currency = "XAF"
}: BalanceCardProps) => {
  // Get initials from user name
  const initials = userName
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="mx-4 overflow-hidden border-0 shadow-lg relative bg-gradient-to-r from-emerald-500 to-teal-600">
      <CardContent className="p-4 text-white">
        <div className="flex items-center space-x-4">
          <Avatar className="h-14 w-14 border-2 border-white/30 bg-white/10">
            <AvatarImage src={avatar} />
            <AvatarFallback className="bg-emerald-700 text-white text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-1 flex-grow">
            <h3 className="font-medium text-white/80 text-sm">
              Solde disponible
            </h3>
            
            <p className="text-2xl font-bold text-white">
              {formatCurrency(balance, currency)}
            </p>
            
            <div className="text-xs text-white/70">
              {userName} • {userCountry}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BalanceCard;
