import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Check, Download, ArrowRightLeft, Wallet, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  date: Date;
  description: string;
  currency: string;
  status: string;
  verification_code?: string;
  created_at?: string;
  showCode?: boolean;
  userType?: 'agent' | 'user';
  recipient_full_name?: string;
  recipient_phone?: string;
  withdrawal_phone?: string;
  fees?: number;
  sender_id?: string;
}

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

const TransactionDetailModal = ({ transaction, isOpen, onClose }: TransactionDetailModalProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!transaction) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Copié",
      description: "L'information a été copiée dans le presse-papiers"
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'withdrawal':
        return <Download className="w-6 h-6 text-red-500" />;
      case 'transfer':
        return <ArrowRightLeft className="w-6 h-6 text-blue-500" />;
      case 'deposit':
        return <Wallet className="w-6 h-6 text-green-500" />;
      default:
        return <Wallet className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Complété';
      case 'pending':
        return 'En attente';
      case 'failed':
        return 'Échoué';
      default:
        return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'withdrawal':
        return 'Retrait';
      case 'transfer':
        return 'Transfert';
      case 'deposit':
        return 'Dépôt';
      default:
        return type;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl">
        <DialogHeader className="text-center pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${
                transaction.type === 'withdrawal' ? 'bg-gradient-to-r from-red-100 to-pink-100' :
                transaction.type === 'transfer' ? 'bg-gradient-to-r from-blue-100 to-purple-100' :
                'bg-gradient-to-r from-green-100 to-emerald-100'
              }`}>
                {getTransactionIcon(transaction.type)}
              </div>
              <div className="text-left">
                <DialogTitle className="text-lg font-bold text-gray-900">
                  {getTypeText(transaction.type)}
                </DialogTitle>
                <p className="text-sm text-gray-500">Détails de la transaction</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Montant principal */}
          <div className="text-center p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl">
            <p className="text-sm text-gray-600 mb-1">Montant</p>
            <p className={`text-3xl font-bold ${
              transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {transaction.amount > 0 ? '+' : ''}
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: transaction.currency || 'XAF',
                maximumFractionDigits: 0
              }).format(transaction.amount)}
            </p>
            {transaction.fees && transaction.fees > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Frais: {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: transaction.currency || 'XAF',
                  maximumFractionDigits: 0
                }).format(transaction.fees)}
              </p>
            )}
          </div>

          {/* Informations détaillées */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Statut</p>
                <Badge className={`${getStatusColor(transaction.status)} border`}>
                  {getStatusText(transaction.status)}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Type</p>
                <Badge variant="outline" className="border-gray-200">
                  {getTypeText(transaction.type)}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">ID de transaction</p>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-sm font-mono text-gray-700 truncate">
                  {transaction.id}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(transaction.id)}
                  className="h-6 w-6 p-0"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Date et heure</p>
              <p className="text-sm text-gray-700">
                {format(transaction.date, 'PPPP à HH:mm', { locale: fr })}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Description</p>
              <p className="text-sm text-gray-700">{transaction.description}</p>
            </div>

            {/* Informations spécifiques au type */}
            {transaction.type === 'transfer' && transaction.recipient_full_name && (
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Destinataire</p>
                <p className="text-sm text-gray-700">{transaction.recipient_full_name}</p>
                {transaction.recipient_phone && (
                  <p className="text-xs text-gray-500">{transaction.recipient_phone}</p>
                )}
              </div>
            )}

            {transaction.type === 'withdrawal' && transaction.withdrawal_phone && (
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Numéro de retrait</p>
                <p className="text-sm text-gray-700">{transaction.withdrawal_phone}</p>
              </div>
            )}

            {transaction.userType && (
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">Type d'utilisateur</p>
                <Badge className={`${
                  transaction.userType === 'agent' 
                    ? 'bg-purple-100 text-purple-700 border-purple-200' 
                    : 'bg-blue-100 text-blue-700 border-blue-200'
                } border`}>
                  {transaction.userType === 'agent' ? 'Agent' : 'Utilisateur'}
                </Badge>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Devise</p>
              <p className="text-sm text-gray-700">{transaction.currency || 'XAF'}</p>
            </div>
          </div>

          {/* Code de vérification si applicable */}
          {transaction.verification_code && transaction.showCode && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="text-center">
                <p className="text-sm font-medium text-blue-700 mb-2">
                  Code de vérification (valide 5 min)
                </p>
                <div className="flex items-center justify-center gap-2">
                  <p className="font-mono font-bold text-xl text-blue-900 tracking-widest">
                    {transaction.verification_code}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(transaction.verification_code!)}
                    className="h-8 w-8 p-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-blue-600" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDetailModal;