import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { User, CreditCard, Upload, Download, ArrowRightLeft, LogOut } from "lucide-react";
import TransferForm from "@/components/TransferForm";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showTransfer, setShowTransfer] = useState(false);
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

  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['transactions'],
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

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-8 px-4">
      <div className="container max-w-3xl mx-auto space-y-8">
        {/* Profile Card */}
        <Card className="bg-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-100 p-3 rounded-full">
                  <User className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{profile?.full_name}</h2>
                  <p className="text-gray-500">{profile?.phone}</p>
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

        {/* Balance Card */}
        <Card className="bg-gradient-to-r from-emerald-500 to-emerald-700 text-white">
          <CardContent className="p-8">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-80">Solde disponible</p>
                <h1 className="text-4xl font-bold mt-1">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'XAF'
                  }).format(profile?.balance || 0)}
                </h1>
              </div>
              <CreditCard className="w-12 h-12 opacity-80" />
            </div>
          </CardContent>
        </Card>

        {showTransfer ? (
          <div className="space-y-4">
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Link to="/receive" className="col-span-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-16 text-sm border-2 flex flex-col gap-1"
              >
                <Upload className="w-4 h-4" />
                Recharger
              </Button>
            </Link>
            <Link to="/withdraw" className="col-span-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-16 text-sm border-2 flex flex-col gap-1"
              >
                <Download className="w-4 h-4" />
                Retrait
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-16 text-sm border-2 flex flex-col gap-1 col-span-2 md:col-span-1"
              onClick={() => setShowTransfer(true)}
            >
              <ArrowRightLeft className="w-4 h-4" />
              Transfert
            </Button>
          </div>
        )}

        {/* Transactions History */}
        <Card className="bg-white shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">Historique des transactions</h3>
            <div className="space-y-4">
              {isLoadingTransactions ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
                </div>
              ) : transactions && transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <div 
                    key={transaction.id} 
                    className="flex justify-between items-center p-4 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{transaction.recipient_full_name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-500">
                        -{new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: transaction.currency || 'XAF'
                        }).format(transaction.amount)}
                      </p>
                      <p className="text-sm text-gray-500">{transaction.status}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">
                  Aucune transaction effectuée
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;