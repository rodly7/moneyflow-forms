
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Copy, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TransactionItem from "./TransactionItem";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Download } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  date: Date;
  description: string;
  currency: string;
  status: string;
  userType?: 'agent' | 'user';
}

interface Withdrawal {
  id: string;
  amount: number;
  created_at: string;
  withdrawal_phone: string;
  status: string;
  verification_code?: string;
  showCode?: boolean;
  userType?: 'agent' | 'user';
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
  const { isAgent } = useAuth();
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
        showCode,
        userType: (isAgent() ? 'agent' : 'user') as 'agent' | 'user'
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
  }, [withdrawals, isAgent]);

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

  // Add userType to transactions
  const transactionsWithUserType = transactions.map(transaction => ({
    ...transaction,
    userType: (isAgent() ? 'agent' : 'user') as 'agent' | 'user'
  }));

  // Combine all transactions and withdrawals for the history view
  const allOperations = [
    ...transactionsWithUserType,
    ...processedWithdrawals.map(withdrawal => ({
      id: withdrawal.id,
      type: 'withdrawal' as const,
      amount: -withdrawal.amount,
      date: new Date(withdrawal.created_at),
      description: `Retrait vers ${withdrawal.withdrawal_phone}`,
      currency: 'XAF',
      status: withdrawal.status,
      userType: withdrawal.userType
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  // Show all transactions instead of limiting to 3
  const allTransactionsToShow = allOperations;

  return (
    <Card className="bg-white shadow-lg mx-2 sm:mx-4">
      <CardHeader className="py-4 px-4">
        <CardTitle className="text-lg font-semibold">Historique</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-3">
          {allTransactionsToShow.length > 0 ? (
            <>
              {allTransactionsToShow.map((operation) => {
                if (operation.type === 'withdrawal') {
                  const withdrawal = processedWithdrawals.find(w => w.id === operation.id);
                  return (
                    <div 
                      key={operation.id} 
                      className="flex flex-col p-3 rounded-lg border hover:bg-gray-50 transition-colors w-full"
                    >
                      <div className="flex justify-between items-start w-full">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="p-2 rounded-full bg-gray-100 shrink-0">
                            <Download className="w-4 h-4 text-red-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm text-gray-900 truncate">{operation.description}</p>
                              {operation.userType && (
                                <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                                  operation.userType === 'agent' 
                                    ? 'bg-purple-100 text-purple-700' 
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {operation.userType === 'agent' ? 'Agent' : 'Utilisateur'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {format(operation.date, 'PPP', { locale: fr })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="font-semibold text-sm text-red-500 whitespace-nowrap">
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: operation.currency || 'XAF',
                              maximumFractionDigits: 0
                            }).format(operation.amount)}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap inline-block mt-1 ${
                            operation.status === 'completed' ? 'bg-green-100 text-green-700' : 
                            operation.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {operation.status === 'completed' ? 'Complété' : 
                             operation.status === 'pending' ? 'En attente' : operation.status}
                          </span>
                        </div>
                      </div>
                      
                      {withdrawal?.showCode && withdrawal.verification_code && (
                        <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200 w-full">
                          <div className="flex justify-between items-center">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-500 mb-1">Code de vérification (valide 5 min):</p>
                              <p className="font-mono font-medium tracking-wider text-sm break-all">{withdrawal.verification_code}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(withdrawal.verification_code!, withdrawal.id)}
                              className="h-8 w-8 p-0 shrink-0 ml-2"
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
                  );
                } else {
                  return (
                    <TransactionItem 
                      key={operation.id} 
                      transaction={operation} 
                      onDelete={onDeleteTransaction}
                    />
                  );
                }
              })}
              
              {/* Link to full transactions page if needed */}
              <div className="text-center pt-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary hover:text-primary/80 font-medium"
                  onClick={() => navigate('/transactions')}
                >
                  Voir la page complète <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 px-4">
              <p className="text-gray-500 bg-gray-50 rounded-lg p-6">
                Aucune opération effectuée
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionsCard;
