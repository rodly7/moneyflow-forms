
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, PiggyBank, TrendingUp } from "lucide-react";
import SavingsAccountCard from "@/components/savings/SavingsAccountCard";
import CreateSavingsAccountModal from "@/components/savings/CreateSavingsAccountModal";
import SavingsDepositModal from "@/components/savings/SavingsDepositModal";
import { formatCurrency } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SavingsAccount {
  id: string;
  name: string;
  balance: number;
  target_amount: number | null;
  target_date: string | null;
  auto_deposit_amount: number | null;
  auto_deposit_frequency: string | null;
}

const Savings = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<{ id: string; name: string } | null>(null);
  const [userBalance, setUserBalance] = useState(0);

  const fetchSavingsAccounts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('savings_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des comptes d\'épargne:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos comptes d'épargne",
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

  const handleDeposit = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      setSelectedAccount({ id: accountId, name: account.name });
      setShowDepositModal(true);
    }
  };

  const handleWithdraw = (accountId: string) => {
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <PiggyBank className="w-8 h-8 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-800">Mes Épargnes</h1>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau compte
          </Button>
        </div>

        {/* Résumé */}
        <Card className="mb-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Résumé de vos épargnes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-green-100 text-sm">Total épargné</p>
                <p className="text-2xl font-bold">{formatCurrency(totalSavings, "XAF")}</p>
              </div>
              <div>
                <p className="text-green-100 text-sm">Nombre de comptes</p>
                <p className="text-2xl font-bold">{accounts.length}</p>
              </div>
              <div>
                <p className="text-green-100 text-sm">Solde disponible</p>
                <p className="text-2xl font-bold">{formatCurrency(userBalance, "XAF")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des comptes d'épargne */}
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
                onWithdraw={handleWithdraw}
              />
            ))}
          </div>
        )}

        {/* Modales */}
        <CreateSavingsAccountModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onAccountCreated={() => {
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
            accountId={selectedAccount.id}
            accountName={selectedAccount.name}
            userBalance={userBalance}
            onDepositSuccess={() => {
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
