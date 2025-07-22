
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
    if (type === 'withdrawal') return <Download className="w-4 h-4 text-red-500" />;
    if (type === 'transfer') return <ArrowRightLeft className="w-4 h-4 text-blue-500" />;
    return <Wallet className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="flex justify-between items-start p-4 rounded-xl border hover:bg-gray-50 transition-colors w-full shadow-sm hover:shadow-md">
      <div className="flex items-start gap-3 flex-1 min-w-0 w-full">
        <div className="p-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 shrink-0">
          {getTransactionIcon(transaction.type)}
        </div>
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <p className="font-semibold text-sm text-gray-900 truncate">{transaction.description}</p>
            {transaction.userType && (
              <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap font-medium ${
                transaction.userType === 'agent' 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {transaction.userType === 'agent' ? 'Agent' : 'Utilisateur'}
              </span>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-600 font-medium">
              ID: {transaction.id.slice(0, 8)}...
            </p>
            <p className="text-xs text-gray-500">
              {format(transaction.date, 'PPP à HH:mm', { locale: fr })}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">Type:</span>
              <span className="text-xs font-medium text-gray-700 capitalize">
                {transaction.type === 'withdrawal' ? 'Retrait' : 
                 transaction.type === 'transfer' ? 'Transfert' : 
                 transaction.type === 'deposit' ? 'Dépôt' : 
                 transaction.type}
              </span>
              <span className="text-xs text-gray-500">•</span>
              <span className="text-xs text-gray-500">Devise:</span>
              <span className="text-xs font-medium text-gray-700">{transaction.currency}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-start gap-2 shrink-0 ml-2">
        <div className="text-right">
          <p className={`font-semibold text-sm whitespace-nowrap ${
            transaction.amount > 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {transaction.amount > 0 ? '+' : ''}
            {new Intl.NumberFormat('fr-FR', {
              style: 'currency',
              currency: transaction.currency || 'XAF',
              maximumFractionDigits: 0
            }).format(transaction.amount)}
          </p>
          <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap inline-block mt-1 ${
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
          className="text-gray-400 hover:text-red-500 h-8 w-8 shrink-0"
          onClick={() => onDelete(transaction.id, transaction.type)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default TransactionItem;
