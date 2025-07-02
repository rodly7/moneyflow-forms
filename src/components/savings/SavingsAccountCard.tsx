
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Piggy Bank, Target, Calendar, Plus } from "lucide-react";
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <Card className="w-full bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-green-700">
          <Piggy Bank className="w-5 h-5" />
          {account.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(account.balance, "XAF")}
          </p>
          <p className="text-sm text-gray-600">Solde épargné</p>
        </div>

        {account.target_amount && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                Objectif
              </span>
              <span className="font-medium">
                {formatCurrency(account.target_amount, "XAF")}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-center text-gray-600">
              {progressPercentage.toFixed(1)}% de l'objectif atteint
            </p>
          </div>
        )}

        {account.target_date && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Échéance : {formatDate(account.target_date)}</span>
          </div>
        )}

        {account.auto_deposit_amount && account.auto_deposit_frequency && (
          <div className="bg-blue-50 p-2 rounded-md">
            <p className="text-sm text-blue-700">
              Dépôt automatique : {formatCurrency(account.auto_deposit_amount, "XAF")} 
              {account.auto_deposit_frequency === 'daily' && ' par jour'}
              {account.auto_deposit_frequency === 'weekly' && ' par semaine'}
              {account.auto_deposit_frequency === 'monthly' && ' par mois'}
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
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
            className="flex-1 border-green-600 text-green-600 hover:bg-green-50"
            size="sm"
          >
            Retirer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SavingsAccountCard;
