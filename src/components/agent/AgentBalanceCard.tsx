
import { Button } from "@/components/ui/button";
import { Wallet, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/integrations/supabase/client";

interface AgentBalanceCardProps {
  balance: number;
  isLoading: boolean;
  onRefresh: () => void;
}

export const AgentBalanceCard = ({ balance, isLoading, onRefresh }: AgentBalanceCardProps) => {
  return (
    <div className="px-3 py-2 bg-emerald-50 rounded-md text-sm border border-emerald-200">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Wallet className="w-4 h-4 mr-2 text-emerald-600" />
          <span className="font-medium">Votre solde agent:</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-bold ${balance > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(balance, 'XAF')}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
    </div>
  );
};
