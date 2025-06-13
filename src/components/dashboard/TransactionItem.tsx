
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Trash2, Download, ArrowRightLeft, Wallet } from "lucide-react";

interface TransactionItemProps {
  transaction: {
    id: string;
    type: string;
    amount: number;
    date: Date;
    description: string;
    currency: string;
    status: string;
    userType?: 'agent' | 'user';
  };
  onDelete: (id: string, type: string) => void;
}

const TransactionItem = ({ transaction, onDelete }: TransactionItemProps) => {
  const getTransactionIcon = (type: string) => {
    if (type === 'withdrawal') return <Download className="w-5 h-5 text-red-500" />;
    if (type === 'transfer') return <ArrowRightLeft className="w-5 h-5 text-blue-500" />;
    return <Wallet className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div 
      className="flex justify-between items-center p-2 rounded-lg border hover:bg-gray-50 transition"
    >
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-full bg-gray-100">
          {getTransactionIcon(transaction.type)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{transaction.description}</p>
            {transaction.userType && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                transaction.userType === 'agent' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {transaction.userType === 'agent' ? 'Agent' : 'Utilisateur'}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {format(transaction.date, 'PPP', { locale: fr })}
          </p>
        </div>
      </div>
      <div className="flex items-center">
        <div className="text-right mr-2">
          <p className={`font-semibold text-sm ${
            transaction.amount > 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {transaction.amount > 0 ? '+' : ''}
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: transaction.currency || 'XAF',
              maximumFractionDigits: 0
            }).format(transaction.amount)}
          </p>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
            transaction.status === 'completed' ? 'bg-green-100 text-green-700' : 
            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
            'bg-gray-100 text-gray-700'
          }`}>
            {transaction.status === 'completed' ? 'Complété' : 
            transaction.status === 'pending' ? 'En attente' : transaction.status}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-red-500 h-8 w-8"
          onClick={() => onDelete(transaction.id, transaction.type)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default TransactionItem;
