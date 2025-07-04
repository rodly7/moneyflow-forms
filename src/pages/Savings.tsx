
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, PiggyBank, TrendingUp, Wallet } from "lucide-react";
import SavingsAccountCard from "@/components/savings/SavingsAccountCard";
import CreateSavingsAccountModal from "@/components/savings/CreateSavingsAccountModal";
import SavingsDepositModal from "@/components/savings/SavingsDepositModal";
import { formatCurrency } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SavingsAccount {
  id: string;
  name: string;
  balance: number;
  target_amount: number;
  target_date: string | null;
  auto_deposit_amount: number | null;
  auto_deposit_frequency: string | null;
  interest_rate: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

const Savings = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<SavingsAccount | null>(null);
  const [userBalance, setUserBalance] = useState(0);

  const fetchSavingsAccounts = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const mockAccounts: SavingsAccount[] = [
        {
          id: '1',
          name: 'Épargne Générale',
          balance: 0,
          target_amount: 100000,
          target_date: null,
          auto_deposit_amount: null,
          auto_deposit_frequency: null,
          interest_rate: 5.0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: user.id
        }
      ];
      
      setAccounts(mockAccounts);
    } catch (error) {
      console.error("Erreur lors du chargement des comptes d'épargne:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les comptes d'épargne",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const fetchUserBalance = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserBalance(data.balance || 0);
    } catch (error) {
      console.error('Erreur lors du chargement du solde:', error);
    }
  };

  const handleDeposit = (account: SavingsAccount) => {
    setSelectedAccount(account);
    setShowDepositModal(true);
  };

  const handleWithdraw = (account: SavingsAccount) => {
    toast({
      title: "Fonctionnalité à venir",
      description: "Le retrait depuis l'épargne sera bientôt disponible",
    });
  };

  const totalSavings = accounts.reduce((sum, account) => sum + account.balance, 0);

  useEffect(() => {
    fetchSavingsAccounts();
    fetchUserBalance();
  }, [user]);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Stunning Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-1 rounded-2xl shadow-xl">
          <div className="bg-white rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full">
                  <PiggyBank className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Mes Épargnes
                  </h1>
                  <p className="text-sm text-muted-foreground">Gérez vos économies</p>
                </div>
              </div>
              <Button 
                onClick={() => setShowCreateModal(true)} 
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau
              </Button>
            </div>
          </div>
        </div>

        {/* Beautiful Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 p-4 rounded-xl text-white shadow-lg">
              <div className="text-center">
                <div className="p-2 bg-white/20 rounded-full w-fit mx-auto mb-2">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <p className="text-white/80 text-xs mb-1">Total épargné</p>
                <p className="text-sm font-bold">{formatCurrency(totalSavings, "XAF")}</p>
              </div>
            </div>
          </div>
          
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative bg-gradient-to-r from-blue-500 to-indigo-500 p-4 rounded-xl text-white shadow-lg">
              <div className="text-center">
                <div className="p-2 bg-white/20 rounded-full w-fit mx-auto mb-2">
                  <PiggyBank className="w-5 h-5" />
                </div>
                <p className="text-white/80 text-xs mb-1">Comptes</p>
                <p className="text-sm font-bold">{accounts.length}</p>
              </div>
            </div>
          </div>
          
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-xl text-white shadow-lg">
              <div className="text-center">
                <div className="p-2 bg-white/20 rounded-full w-fit mx-auto mb-2">
                  <Wallet className="w-5 h-5" />
                </div>
                <p className="text-white/80 text-xs mb-1">Disponible</p>
                <p className="text-sm font-bold">{formatCurrency(userBalance, "XAF")}</p>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : accounts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <PiggyBank className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                Aucun compte d'épargne
              </h3>
              <p className="text-gray-500 mb-6">
                Créez votre premier compte d'épargne pour commencer à économiser
              </p>
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer un compte d'épargne
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => (
              <SavingsAccountCard
                key={account.id}
                account={account}
                onDeposit={handleDeposit}
              />
            ))}
          </div>
        )}

        <CreateSavingsAccountModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchSavingsAccounts();
            fetchUserBalance();
          }}
        />

        {selectedAccount && (
          <SavingsDepositModal
            isOpen={showDepositModal}
            onClose={() => {
              setShowDepositModal(false);
              setSelectedAccount(null);
            }}
            account={selectedAccount}
            onSuccess={() => {
              fetchSavingsAccounts();
              fetchUserBalance();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Savings;
