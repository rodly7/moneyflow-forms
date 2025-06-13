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
import NotificationBell from "@/components/notifications/NotificationBell";
import BiometricConfirmation from "@/components/withdrawal/BiometricConfirmation";
import { useToast } from "@/hooks/use-toast";
import { Bell } from "lucide-react";

const Dashboard = () => {
  const { user, isAgent } = useAuth();
  const { toast } = useToast();
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showBiometricConfirmation, setShowBiometricConfirmation] = useState(false);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);

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
    }
  }, [notifications]);

  const handleNotificationClick = () => {
    if (pendingWithdrawals.length > 0) {
      const firstWithdrawal = pendingWithdrawals[0];
      setSelectedWithdrawal(firstWithdrawal);
      setShowBiometricConfirmation(true);
    }
  };

  const handleConfirmWithdrawal = async () => {
    if (!selectedWithdrawal) return;
    
    try {
      // Traiter la confirmation du retrait
      await supabase
        .from('withdrawals')
        .update({ status: 'completed' })
        .eq('id', selectedWithdrawal.id);
      
      // Débiter le compte utilisateur
      await supabase.rpc('increment_balance', {
        user_id: user?.id,
        amount: -selectedWithdrawal.amount
      });

      toast({
        title: "Retrait confirmé",
        description: `Retrait de ${selectedWithdrawal.amount} FCFA effectué avec succès`,
      });

      setShowBiometricConfirmation(false);
      setSelectedWithdrawal(null);
      
    } catch (error) {
      console.error("Erreur confirmation retrait:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la confirmation du retrait",
        variant: "destructive"
      });
    }
  };

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
        {/* Header avec icône de notification pour les utilisateurs */}
        <div className="flex items-center justify-between">
          <ProfileHeader profile={profile} />
          {!isAgent() && (
            <NotificationBell 
              notificationCount={pendingWithdrawals.length}
              onClick={handleNotificationClick}
            />
          )}
        </div>
        
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
        
        {showBiometricConfirmation && selectedWithdrawal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <BiometricConfirmation 
              withdrawalData={{
                id: selectedWithdrawal.id,
                amount: selectedWithdrawal.amount,
                agentName: "Agent" // Vous pouvez récupérer le nom de l'agent si nécessaire
              }}
              onClose={() => setShowBiometricConfirmation(false)}
              onConfirm={handleConfirmWithdrawal}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
