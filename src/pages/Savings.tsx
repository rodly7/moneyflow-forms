
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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Clean Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-medium">Mes Épargnes</h1>
          <Button onClick={() => setShowCreateModal(true)} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau
          </Button>
        </div>

        {/* Simple Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-card rounded-lg border">
            <p className="text-xs text-muted-foreground mb-1">Total épargné</p>
            <p className="text-lg font-medium">{formatCurrency(totalSavings, "XAF")}</p>
          </div>
          <div className="text-center p-4 bg-card rounded-lg border">
            <p className="text-xs text-muted-foreground mb-1">Comptes</p>
            <p className="text-lg font-medium">{accounts.length}</p>
          </div>
          <div className="text-center p-4 bg-card rounded-lg border">
            <p className="text-xs text-muted-foreground mb-1">Disponible</p>
            <p className="text-lg font-medium">{formatCurrency(userBalance, "XAF")}</p>
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
