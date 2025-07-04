import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, ArrowRightLeft, Copy, Check } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
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
  verification_code?: string;
  created_at?: string;
  showCode?: boolean;
  userType?: 'agent' | 'user';
}

const Transactions = () => {
  const navigate = useNavigate();
  const { user, isAgent } = useAuth();
  const { toast } = useToast();
  const [copiedCodes, setCopiedCodes] = useState<{[key: string]: boolean}>({});

  const { data: withdrawals } = useQuery({
    queryKey: ['withdrawals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: transfers } = useQuery({
    queryKey: ['transfers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transfers')
        .select('*')
        .eq('sender_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
  
  const [processedWithdrawals, setProcessedWithdrawals] = useState<any[]>([]);

  useEffect(() => {
    if (withdrawals) {
      // Process withdrawals to determine which codes should be visible based on creation time
      const processed = withdrawals.map(withdrawal => {
        const createdAt = new Date(withdrawal.created_at);
        const now = new Date();
        const timeDiffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
        const showCode = timeDiffMinutes <= 5 && withdrawal.verification_code && withdrawal.status === 'pending';
        
        return {
          ...withdrawal,
          showCode,
          userType: isAgent() ? 'agent' : 'user'
        };
      });
      
      setProcessedWithdrawals(processed);
    }
    
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

  if (!user) {
    return null;
  }

  const allTransactions: Transaction[] = [
    ...(withdrawals?.map(w => ({
      id: w.id,
      type: 'withdrawal',
      amount: -w.amount,
      date: parseISO(w.created_at),
      description: `Retrait vers ${w.withdrawal_phone}`,
      currency: 'XAF',
      status: w.status,
      verification_code: w.verification_code,
      created_at: w.created_at,
      userType: isAgent() ? 'agent' as const : 'user' as const
    })) || []),
    ...(transfers?.map(t => ({
      id: t.id,
      type: 'transfer',
      amount: -t.amount,
      date: parseISO(t.created_at),
      description: `Transfert à ${t.recipient_full_name}`,
      currency: 'XAF',
      status: t.status,
      userType: isAgent() ? 'agent' as const : 'user' as const
    })) || [])
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  // Process transaction to determine which codes should be visible
  const processedTransactions = allTransactions.map(transaction => {
    if (transaction.type === 'withdrawal' && transaction.verification_code) {
      const createdAt = transaction.created_at ? new Date(transaction.created_at) : new Date();
      const now = new Date();
      const timeDiffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
      const showCode = timeDiffMinutes <= 5 && transaction.verification_code && transaction.status === 'pending';
      
      return {
        ...transaction,
        showCode
      };
    }
    return transaction;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'withdrawal':
        return <Download className="h-4 w-4 text-red-500" />;
      case 'transfer':
        return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const renderTransaction = (transaction: Transaction) => (
    <div key={transaction.id} className="p-3 hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
            {getIcon(transaction.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm truncate">{transaction.description}</p>
              {transaction.userType && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  transaction.userType === 'agent' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {transaction.userType === 'agent' ? 'Agent' : 'User'}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(transaction.date, 'dd MMM yyyy', { locale: fr })}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-semibold text-sm ${
            transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
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
            'bg-muted text-muted-foreground'
          }`}>
            {transaction.status === 'completed' ? 'OK' : 
             transaction.status === 'pending' ? 'En cours' : transaction.status}
          </span>
        </div>
      </div>
      
      {transaction.showCode && transaction.verification_code && (
        <div className="mt-2 p-2 bg-muted rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Code (5 min):</p>
              <p className="font-mono font-bold text-sm">{transaction.verification_code}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(transaction.verification_code!, transaction.id)}
              className="h-8 w-8 p-0"
            >
              {copiedCodes[transaction.id] ? (
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

  return (
    <div className="min-h-screen bg-background p-3">
      <div className="max-w-4xl mx-auto space-y-3">
        {/* Compact Header */}
        <div className="flex items-center gap-3 p-3 bg-card rounded-lg border">
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Transactions</h1>
              <p className="text-xs text-muted-foreground">{processedTransactions.length} opérations</p>
            </div>
          </div>
        </div>

        {/* Compact Transactions List */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-0">
            {processedTransactions.length > 0 ? (
              <div className="divide-y">
                {processedTransactions.map(renderTransaction)}
              </div>
            ) : (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowRightLeft className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Aucune transaction effectuée</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Transactions;
