
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { 
  User, 
  Download, 
  ArrowRightLeft, 
  LogOut, 
  Wallet, 
  ChevronRight, 
  CreditCard, 
  Receipt, 
  Phone,
  EyeOff,
  Eye,
  Trash2
} from "lucide-react";
import TransferForm from "@/components/TransferForm";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ProfileEditForm from "@/components/ProfileEditForm";

const Index = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showTransfer, setShowTransfer] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);
  const { toast } = useToast();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: withdrawals } = useQuery({
    queryKey: ['withdrawals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: recharges } = useQuery({
    queryKey: ['recharges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recharges')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data;
    },
  });

  const { data: transfers } = useQuery({
    queryKey: ['transfers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transfers')
        .select('*')
        .eq('sender_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data;
    },
  });

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleDeleteTransaction = async (transactionId: string, type: string) => {
    try {
      const { error } = await supabase
        .from(type === 'withdrawal' ? 'withdrawals' : 'transfers')
        .update({ status: 'deleted' })
        .eq('id', transactionId);

      if (error) throw error;
      
      toast({
        title: "Transaction supprimée",
        description: "La transaction a été supprimée avec succès"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la transaction",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
    </div>;
  }

  const allTransactions = [
    ...(withdrawals?.map(w => ({
      id: w.id,
      type: 'withdrawal',
      amount: -w.amount,
      date: new Date(w.created_at),
      description: `Retrait vers ${w.withdrawal_phone}`,
      currency: 'XAF',
      status: w.status
    })) || []),
    ...(transfers?.map(t => ({
      id: t.id,
      type: 'transfer',
      amount: -t.amount,
      date: new Date(t.created_at),
      description: `Transfert à ${t.recipient_full_name}`,
      currency: 'XAF',
      status: t.status
    })) || [])
  ]
  .filter(t => t.status !== 'deleted')
  .sort((a, b) => b.date.getTime() - a.date.getTime())
  .slice(0, 3);

  const getTransactionIcon = (type: string) => {
    if (type === 'withdrawal') return <Download className="w-5 h-5 text-red-500" />;
    if (type === 'transfer') return <ArrowRightLeft className="w-5 h-5 text-blue-500" />;
    return <Wallet className="w-5 h-5 text-blue-500" />;
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-4 px-0 sm:py-8 sm:px-0">
      <div className="container max-w-full mx-auto space-y-4">
        <Card className="bg-white shadow-lg mx-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="cursor-pointer">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile?.avatar_url} alt={profile?.full_name} />
                        <AvatarFallback className="bg-emerald-100 text-emerald-600">
                          {getInitials(profile?.full_name || '')}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Modifier votre profil</DialogTitle>
                    </DialogHeader>
                    <ProfileEditForm profile={profile} />
                  </DialogContent>
                </Dialog>
                <div>
                  <h2 className="text-lg font-semibold">{profile?.full_name}</h2>
                  <p className="text-xs text-gray-500">{profile?.phone}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-gray-500 hover:text-gray-700"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-emerald-500 to-emerald-700 text-white mx-4">
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-80">Solde disponible</p>
                <h1 className="text-2xl sm:text-3xl font-bold mt-1 flex items-center">
                  {hideBalance ? (
                    "••••••"
                  ) : (
                    new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'XAF',
                      maximumFractionDigits: 0
                    }).format(profile?.balance || 0)
                  )}
                  <Button
                    onClick={() => setHideBalance(!hideBalance)}
                    variant="ghost"
                    size="icon"
                    className="ml-2 text-white/80 hover:text-white hover:bg-white/10"
                  >
                    {hideBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                </h1>
              </div>
              <Wallet className="w-10 h-10 opacity-80" />
            </div>
            
            {showQR && (
              <div className="mt-4 flex justify-center">
                <div className="scale-75 transform origin-top">
                  <QRCodeGenerator 
                    action="transfer" 
                    showCard={false} 
                    userAvatar={profile?.avatar_url} 
                    userName={profile?.full_name}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {showTransfer ? (
          <div className="space-y-4 mx-4">
            <Button
              variant="outline"
              onClick={() => setShowTransfer(false)}
              className="mb-4"
            >
              ← Retour
            </Button>
            <TransferForm />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 mx-4">
              <Link to="/withdraw" className="col-span-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-14 text-xs border-2 flex flex-col gap-1"
                >
                  <Download className="w-4 h-4" />
                  Retrait
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-14 text-xs border-2 flex flex-col gap-1 col-span-1"
                onClick={() => setShowTransfer(true)}
              >
                <ArrowRightLeft className="w-4 h-4" />
                Transfert
              </Button>
            </div>
            
            <div className="mx-4 mt-4">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Services additionnels</h3>
              <div className="grid grid-cols-3 gap-2">
                <Link to="/bill-payments" className="col-span-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-14 text-xs border-2 flex flex-col gap-1"
                  >
                    <Receipt className="w-4 h-4 text-blue-500" />
                    Factures
                  </Button>
                </Link>
                <Link to="/mobile-recharge" className="col-span-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-14 text-xs border-2 flex flex-col gap-1"
                  >
                    <Phone className="w-4 h-4 text-green-500" />
                    Recharges
                  </Button>
                </Link>
                <Link to="/prepaid-cards" className="col-span-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-24 text-xs border-2 flex flex-col gap-1 bg-gradient-to-r from-blue-50 to-purple-50"
                  >
                    <CreditCard className="w-8 h-8 text-purple-500" />
                    <span className="font-medium">Cartes prépayées</span>
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}

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
                {allTransactions.length > 0 ? (
                  allTransactions.map((transaction) => (
                    <div 
                      key={transaction.id} 
                      className="flex justify-between items-center p-2 rounded-lg border hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-gray-100">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{transaction.description}</p>
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
                          className="text-gray-400 hover:text-red-500"
                          onClick={() => handleDeleteTransaction(transaction.id, transaction.type)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-6 bg-gray-50 rounded-lg">
                    Aucune opération effectuée
                  </p>
                )}
                
                {allTransactions.length > 0 && (
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
      </div>
    </div>
  );
};

export default Index;
