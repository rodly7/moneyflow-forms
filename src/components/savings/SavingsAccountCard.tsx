
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PiggyBank, Plus, Minus } from "lucide-react";
import { formatCurrency } from "@/integrations/supabase/client";

interface SavingsAccount {
  id: string;
  name: string;
  balance: number;
  target_amount: number | null;
  target_date: string | null;
  auto_deposit_amount: number | null;
  auto_deposit_frequency: string | null;
}

interface SavingsAccountCardProps {
  account: SavingsAccount;
  onDeposit: (accountId: string) => void;
  onWithdraw: (accountId: string) => void;
}

const SavingsAccountCard = ({ account, onDeposit, onWithdraw }: SavingsAccountCardProps) => {
  const progressPercentage = account.target_amount 
    ? Math.min((account.balance / account.target_amount) * 100, 100)
    : 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PiggyBank className="w-5 h-5 text-green-600" />
          {account.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Solde actuel</span>
            <span className="text-xl font-bold text-green-600">
              {formatCurrency(account.balance, "XAF")}
            </span>
          </div>
          
          {account.target_amount && (
            <>
              <Progress value={progressPercentage} className="mb-2" />
              <div className="flex justify-between text-sm text-gray-600">
                <span>Objectif: {formatCurrency(account.target_amount, "XAF")}</span>
                <span>{progressPercentage.toFixed(1)}%</span>
              </div>
            </>
          )}
        </div>

        {account.target_date && (
          <div className="text-sm text-gray-600">
            <span>Date cible: {new Date(account.target_date).toLocaleDateString('fr-FR')}</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={() => onDeposit(account.id)}
            className="flex-1 bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Déposer
          </Button>
          <Button
            onClick={() => onWithdraw(account.id)}
            variant="outline"
            className="flex-1"
            size="sm"
          >
            <Minus className="w-4 h-4 mr-1" />
            Retirer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SavingsAccountCard;
