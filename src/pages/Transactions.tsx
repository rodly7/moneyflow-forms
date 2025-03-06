
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Search, Wallet, Download, ArrowRightLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { Input } from "@/components/ui/input";

type WithdrawalTransaction = {
  id: string;
  type: 'withdrawal';
  amount: number;
  date: Date;
  description: string;
  phone: string;
  details: string;
  currency: string;
  status: string;
};

type RechargeTransaction = {
  id: string;
  type: 'recharge';
  amount: number;
  date: Date;
  description: string;
  method: string;
  details: string;
  currency: string;
  status: string;
};

type TransferTransaction = {
  id: string;
  type: 'transfer';
  amount: number;
  date: Date;
  description: string;
  recipient: string;
  details: string;
  currency: string;
  status: string;
};

type Transaction = WithdrawalTransaction | RechargeTransaction | TransferTransaction;

const Transactions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const initialTab = location.state?.initialTab || "all";
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(initialTab);

  const { data: withdrawals, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ['all-withdrawals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: recharges, isLoading: rechargesLoading } = useQuery({
    queryKey: ['all-recharges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recharges')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: transfers, isLoading: transfersLoading } = useQuery({
    queryKey: ['all-transfers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transfers')
        .select('*')
        .eq('sender_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const allTransactions: Transaction[] = [
    ...(withdrawals?.map(w => ({
      id: w.id,
      type: 'withdrawal' as const,
      amount: -w.amount,
      date: new Date(w.created_at),
      description: `Retrait vers ${w.withdrawal_phone}`,
      phone: w.withdrawal_phone,
      details: w.withdrawal_phone,
      currency: 'XAF',
      status: w.status
    })) || []),
    ...(recharges?.map(r => ({
      id: r.id,
      type: 'recharge' as const,
      amount: r.amount,
      date: new Date(r.created_at),
      description: `Recharge via ${r.payment_method}`,
      method: r.payment_method,
      details: r.payment_phone,
      currency: 'XAF',
      status: r.status
    })) || []),
    ...(transfers?.map(t => ({
      id: t.id,
      type: 'transfer' as const,
      amount: -t.amount,
      date: new Date(t.created_at),
      description: `Transfert à ${t.recipient_full_name}`,
      recipient: t.recipient_full_name,
      details: t.recipient_phone,
      currency: 'XAF',
      status: t.status
    })) || [])
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const filteredTransactions = allTransactions.filter(transaction => {
    const searchLower = searchQuery.toLowerCase();
    
    if (transaction.description.toLowerCase().includes(searchLower)) return true;
    if (transaction.details.toLowerCase().includes(searchLower)) return true;
    
    if (transaction.type === 'withdrawal' && transaction.phone.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    if (transaction.type === 'recharge' && transaction.method.toLowerCase().includes(searchLower)) {
      return true;
    }

    if (transaction.type === 'transfer' && transaction.recipient.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    return false;
  });
  
  const filteredWithdrawals = withdrawals?.filter(withdrawal => 
    withdrawal.withdrawal_phone.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  const filteredRecharges = recharges?.filter(recharge => 
    recharge.payment_method.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recharge.payment_phone.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredTransfers = transfers?.filter(transfer => 
    transfer.recipient_full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    transfer.recipient_phone.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getTransactionIcon = (type) => {
    if (type === 'withdrawal') return <Download className="w-5 h-5 text-red-500" />;
    if (type === 'recharge') return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
    if (type === 'transfer') return <ArrowRightLeft className="w-5 h-5 text-blue-500" />;
    return <Wallet className="w-5 h-5 text-blue-500" />;
  };

  const isLoading = withdrawalsLoading || rechargesLoading || transfersLoading;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-4 px-0">
      <div className="max-w-full mx-auto space-y-4">
        <div className="flex items-center justify-between px-4 mb-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')}
            className="text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Historique des opérations</h1>
          <div className="w-9"></div>
        </div>

        <div className="px-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            <Input
              type="text"
              placeholder="Rechercher une opération..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-3 py-2 w-full"
            />
          </div>
        </div>

        <Card className="bg-white shadow-md mx-4">
          <CardContent className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="all">Toutes</TabsTrigger>
                <TabsTrigger value="withdrawals">Retraits</TabsTrigger>
                <TabsTrigger value="recharges">Recharges</TabsTrigger>
                <TabsTrigger value="transfers">Transferts</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="space-y-2">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
                  </div>
                ) : filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <div 
                      key={transaction.id} 
                      className="flex justify-between items-center p-3 rounded-lg border hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 rounded-full bg-gray-100">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{transaction.description}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {transaction.details}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(transaction.date, 'PPP à HH:mm', { locale: fr })}
                          </p>
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
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-12 bg-gray-50 rounded-lg">
                    {searchQuery 
                      ? "Aucune opération ne correspond à votre recherche" 
                      : "Aucune opération effectuée"}
                  </p>
                )}
              </TabsContent>
              
              <TabsContent value="withdrawals" className="space-y-2">
                {withdrawalsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
                  </div>
                ) : filteredWithdrawals.length > 0 ? (
                  filteredWithdrawals.map((withdrawal) => (
                    <div 
                      key={withdrawal.id} 
                      className="flex justify-between items-center p-3 rounded-lg border hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 rounded-full bg-gray-100">
                          <Download className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">Retrait vers {withdrawal.withdrawal_phone}</p>
                          <p className="text-xs text-gray-500 truncate">
                            Mobile Money
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(withdrawal.created_at), 'PPP à HH:mm', { locale: fr })}
                          </p>
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
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-12 bg-gray-50 rounded-lg">
                    {searchQuery 
                      ? "Aucun retrait ne correspond à votre recherche" 
                      : "Aucun retrait effectué"}
                  </p>
                )}
              </TabsContent>
              
              <TabsContent value="recharges" className="space-y-2">
                {rechargesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
                  </div>
                ) : filteredRecharges.length > 0 ? (
                  filteredRecharges.map((recharge) => (
                    <div 
                      key={recharge.id} 
                      className="flex justify-between items-center p-3 rounded-lg border hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 rounded-full bg-gray-100">
                          <ArrowDownLeft className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">Recharge via {recharge.payment_method}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {recharge.payment_phone}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(recharge.created_at), 'PPP à HH:mm', { locale: fr })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm text-green-500">
                            +{new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'XAF',
                              maximumFractionDigits: 0
                            }).format(recharge.amount)}
                          </p>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            recharge.status === 'completed' ? 'bg-green-100 text-green-700' : 
                            recharge.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {recharge.status === 'completed' ? 'Complété' : 
                            recharge.status === 'pending' ? 'En attente' : recharge.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-12 bg-gray-50 rounded-lg">
                    {searchQuery 
                      ? "Aucune recharge ne correspond à votre recherche" 
                      : "Aucune recharge effectuée"}
                  </p>
                )}
              </TabsContent>

              <TabsContent value="transfers" className="space-y-2">
                {transfersLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
                  </div>
                ) : filteredTransfers.length > 0 ? (
                  filteredTransfers.map((transfer) => (
                    <div 
                      key={transfer.id} 
                      className="flex justify-between items-center p-3 rounded-lg border hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 rounded-full bg-gray-100">
                          <ArrowRightLeft className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">Transfert à {transfer.recipient_full_name}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {transfer.recipient_phone}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(transfer.created_at), 'PPP à HH:mm', { locale: fr })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm text-red-500">
                            -{new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'XAF',
                              maximumFractionDigits: 0
                            }).format(transfer.amount)}
                          </p>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            transfer.status === 'completed' ? 'bg-green-100 text-green-700' : 
                            transfer.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {transfer.status === 'completed' ? 'Complété' : 
                            transfer.status === 'pending' ? 'En attente' : transfer.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-12 bg-gray-50 rounded-lg">
                    {searchQuery 
                      ? "Aucun transfert ne correspond à votre recherche" 
                      : "Aucun transfert effectué"}
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
