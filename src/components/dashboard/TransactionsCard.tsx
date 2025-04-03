
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TransactionItem from "./TransactionItem";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Download } from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  date: Date;
  description: string;
  currency: string;
  status: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  created_at: string;
  withdrawal_phone: string;
  status: string;
}

interface TransactionsCardProps {
  transactions: Transaction[];
  withdrawals?: Withdrawal[];
  onDeleteTransaction: (id: string, type: string) => void;
}

const TransactionsCard = ({ 
  transactions, 
  withdrawals = [], 
  onDeleteTransaction 
}: TransactionsCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="bg-white shadow-lg mx-4">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-base font-semibold">Opérations récentes</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <Tabs defaultValue="all">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="withdrawals">Retraits</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-2">
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <TransactionItem 
                  key={transaction.id} 
                  transaction={transaction} 
                  onDelete={onDeleteTransaction}
                />
              ))
            ) : (
              <p className="text-center text-gray-500 py-6 bg-gray-50 rounded-lg">
                Aucune opération effectuée
              </p>
            )}
            
            {transactions.length > 0 && (
              <div className="text-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary"
                  onClick={() => navigate('/transactions')}
                >
                  Voir tout <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="withdrawals" className="space-y-2">
            {withdrawals && withdrawals.length > 0 ? (
              withdrawals.slice(0, 3).map((withdrawal) => (
                <div 
                  key={withdrawal.id} 
                  className="flex justify-between items-center p-2 rounded-lg border hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-gray-100">
                      <Download className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Retrait vers {withdrawal.withdrawal_phone}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(withdrawal.created_at), 'PPP', { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-red-500">
                      -{new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: 'XAF',
                        maximumFractionDigits: 0
                      }).format(withdrawal.amount)}
                    </p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      withdrawal.status === 'completed' ? 'bg-green-100 text-green-700' : 
                      withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {withdrawal.status === 'completed' ? 'Complété' : 
                       withdrawal.status === 'pending' ? 'En attente' : withdrawal.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-6 bg-gray-50 rounded-lg">
                Aucun retrait effectué
              </p>
            )}
            
            {withdrawals && withdrawals.length > 0 && (
              <div className="text-center">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary"
                  onClick={() => navigate('/transactions', { state: { initialTab: 'withdrawals' }})}
                >
                  Voir tout <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TransactionsCard;
