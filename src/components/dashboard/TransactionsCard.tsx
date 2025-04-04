
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight, Copy, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TransactionItem from "./TransactionItem";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Download } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

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
  verification_code?: string;
  showCode?: boolean;
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
  const { toast } = useToast();
  const [processedWithdrawals, setProcessedWithdrawals] = useState<Withdrawal[]>([]);
  const [copiedCodes, setCopiedCodes] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    // Process withdrawals to determine which codes should be visible based on creation time
    const processed = withdrawals.map(withdrawal => {
      const createdAt = new Date(withdrawal.created_at);
      const now = new Date();
      const timeDiffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
      const showCode = timeDiffMinutes <= 5 && withdrawal.verification_code && withdrawal.status === 'pending';
      
      return {
        ...withdrawal,
        showCode
      };
    });
    
    setProcessedWithdrawals(processed);
    
    // Set up a timer to update the visibility every minute
    const timer = setInterval(() => {
      setProcessedWithdrawals(current => 
        current.map(withdrawal => {
          const createdAt = new Date(withdrawal.created_at);
          const now = new Date();
          const timeDiffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
          const showCode = timeDiffMinutes <= 5 && withdrawal.verification_code && withdrawal.status === 'pending';
          
          return {
            ...withdrawal,
            showCode
          };
        })
      );
    }, 60000); // Check every minute
    
    return () => clearInterval(timer);
  }, [withdrawals]);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodes({...copiedCodes, [id]: true});
    
    toast({
      title: "Code copié",
      description: "Le code de vérification a été copié dans le presse-papiers"
    });
    
    // Reset copy indicator after 2 seconds
    setTimeout(() => {
      setCopiedCodes(current => ({...current, [id]: false}));
    }, 2000);
  };

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
            {processedWithdrawals && processedWithdrawals.length > 0 ? (
              processedWithdrawals.slice(0, 3).map((withdrawal) => (
                <div 
                  key={withdrawal.id} 
                  className="flex flex-col p-2 rounded-lg border hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-center">
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
                  
                  {withdrawal.showCode && withdrawal.verification_code && (
                    <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Code de vérification (valide 5 min):</p>
                          <p className="font-mono font-medium tracking-wider text-sm">{withdrawal.verification_code}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(withdrawal.verification_code!, withdrawal.id)}
                          className="h-8 w-8 p-0"
                        >
                          {copiedCodes[withdrawal.id] ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
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
