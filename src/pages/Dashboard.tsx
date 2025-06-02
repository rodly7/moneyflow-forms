
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import BalanceCard from "@/components/dashboard/BalanceCard";
import ActionButtons from "@/components/dashboard/ActionButtons";
import ProfileHeader from "@/components/dashboard/ProfileHeader";
import TransactionsCard from "@/components/dashboard/TransactionsCard";
import TransferForm from "@/components/TransferForm";
import WithdrawalConfirmation from "@/components/withdrawal/WithdrawalConfirmation";
import { Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { user, isAgent } = useAuth();
  const { toast } = useToast();
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showWithdrawalConfirmation, setShowWithdrawalConfirmation] = useState(false);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);

  // Check for pending withdrawal requests for users
  const { data: notifications } = useQuery({
    queryKey: ['pending-withdrawals', user?.id],
    queryFn: async () => {
      if (!user?.id || isAgent()) return [];
      
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'agent_pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && !isAgent(),
    refetchInterval: 30000, // Check every 30 seconds
  });

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      setPendingWithdrawals(notifications);
      
      // Show toast notification for new pending withdrawals
      notifications.forEach((withdrawal: any) => {
        toast({
          title: "Demande de retrait",
          description: `Un agent souhaite effectuer un retrait de ${withdrawal.amount} FCFA sur votre compte.`,
          action: (
            <Button 
              size="sm" 
              onClick={() => setShowWithdrawalConfirmation(true)}
            >
              Voir
            </Button>
          ),
        });
      });
    }
  }, [notifications, toast]);

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: transfers } = useQuery({
    queryKey: ['transfers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('transfers')
        .select('*')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Transform transfers data to match Transaction interface
  const transformedTransactions = transfers?.map(transfer => ({
    id: transfer.id,
    type: 'transfer',
    amount: -transfer.amount, // Negative because it's outgoing
    date: new Date(transfer.created_at),
    description: `Transfert vers ${transfer.recipient_full_name}`,
    currency: transfer.currency,
    status: transfer.status
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <ProfileHeader profile={profile} />
        
        {/* Pending withdrawal notifications for users */}
        {!isAgent() && pendingWithdrawals.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-orange-800 flex items-center text-sm">
                <Bell className="w-4 h-4 mr-2" />
                Demandes de retrait en attente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-orange-700 mb-2">
                Vous avez {pendingWithdrawals.length} demande(s) de retrait en attente.
              </p>
              <Button
                size="sm"
                onClick={() => setShowWithdrawalConfirmation(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Voir les demandes
              </Button>
            </CardContent>
          </Card>
        )}

        <BalanceCard balance={profile?.balance || 0} userCountry={profile?.country || "Cameroun"} />
        <ActionButtons onTransferClick={() => setShowTransferForm(true)} />
        <TransactionsCard transactions={transformedTransactions} onDeleteTransaction={() => {}} />
        
        {showTransferForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <TransferForm />
              <div className="p-4">
                <Button 
                  onClick={() => setShowTransferForm(false)}
                  variant="outline"
                  className="w-full"
                >
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {showWithdrawalConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <WithdrawalConfirmation onClose={() => setShowWithdrawalConfirmation(false)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
