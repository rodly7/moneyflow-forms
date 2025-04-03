
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, QrCode, Wallet } from "lucide-react";
import QRCodeGenerator from "@/components/QRCodeGenerator";

interface BalanceCardProps {
  balance: number;
  avatar?: string;
  userName: string;
}

const BalanceCard = ({ balance, avatar, userName }: BalanceCardProps) => {
  const [hideBalance, setHideBalance] = useState(true);
  const [showQR, setShowQR] = useState(false);

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
                new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'XAF',
                  maximumFractionDigits: 0
                }).format(balance || 0)
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
              onClick={() => setShowQR(!showQR)}
              variant="ghost" 
              size="sm"
              className="text-white/90 hover:text-white hover:bg-white/10 rounded-full p-2 h-auto"
            >
              <QrCode className="w-6 h-6" />
            </Button>
          </div>
        </div>
        
        {showQR && (
          <div className="mt-4 flex justify-center">
            <QRCodeGenerator 
              action="transfer" 
              showCard={false} 
              userAvatar={avatar} 
              userName={userName}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BalanceCard;
