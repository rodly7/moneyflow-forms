import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, ArrowRightLeft } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

const Transactions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const initialTab = location.state?.initialTab || "all";

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

  if (!user) {
    return null;
  }

  const allTransactions = [
    ...(withdrawals?.map(w => ({
      id: w.id,
      type: 'withdrawal',
      amount: -w.amount,
      date: parseISO(w.created_at),
      description: `Retrait vers ${w.withdrawal_phone}`,
      currency: 'XAF',
      status: w.status
    })) || []),
    ...(transfers?.map(t => ({
      id: t.id,
      type: 'transfer',
      amount: -t.amount,
      date: parseISO(t.created_at),
      description: `Transfert à ${t.recipient_full_name}`,
      currency: 'XAF',
      status: t.status
    })) || [])
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const getIcon = (type) => {
    switch (type) {
      case 'withdrawal':
        return <Download className="h-5 w-5 text-red-500" />;
      case 'transfer':
        return <ArrowRightLeft className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-8 px-4">
      <div className="container max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Historique des transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={initialTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all">Toutes</TabsTrigger>
                <TabsTrigger value="withdrawals">Retraits</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                {allTransactions.length > 0 ? (
                  allTransactions.map((transaction) => (
                    <div 
                      key={transaction.id} 
                      className="flex justify-between items-center p-2 rounded-lg border hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-gray-100">
                          {getIcon(transaction.type)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{transaction.description}</p>
                          <p className="text-xs text-gray-500">
                            {format(transaction.date, 'PPP', { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
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
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-6 bg-gray-50 rounded-lg">
                    Aucune transaction effectuée
                  </p>
                )}
              </TabsContent>
              
              <TabsContent value="withdrawals">
                {withdrawals && withdrawals.length > 0 ? (
                  withdrawals.map((withdrawal) => (
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
                            {format(parseISO(withdrawal.created_at), 'PPP', { locale: fr })}
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Transactions;
