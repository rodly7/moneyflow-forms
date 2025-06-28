
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import BalanceCard from "@/components/dashboard/BalanceCard";
import ActionButtons from "@/components/dashboard/ActionButtons";
import ProfileHeader from "@/components/dashboard/ProfileHeader";
import TransactionsCard from "@/components/dashboard/TransactionsCard";
import TransferForm from "@/components/TransferForm";
import { useWithdrawalRequestNotifications } from "@/hooks/useWithdrawalRequestNotifications";
import WithdrawalRequestNotification from "@/components/notifications/WithdrawalRequestNotification";

const Dashboard = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [showTransferForm, setShowTransferForm] = useState(false);
  
  const {
    selectedRequest,
    showSecureConfirmation,
    handleNotificationClick,
    handleSecureConfirm,
    handleSecureReject,
    closeSecureConfirmation
  } = useWithdrawalRequestNotifications();

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
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Rafraîchir le profil périodiquement mais moins fréquemment
  useQuery({
    queryKey: ['profile-refresh', user?.id],
    queryFn: async () => {
      await refreshProfile();
      return true;
    },
    enabled: !!user,
    refetchInterval: 2 * 60 * 1000, // Toutes les 2 minutes au lieu de 30 secondes
    staleTime: 60 * 1000, // Cache for 1 minute
  });

  const transformedTransactions = transfers?.map(transfer => ({
    id: transfer.id,
    type: 'transfer',
    amount: -transfer.amount,
    date: new Date(transfer.created_at),
    description: `Transfert vers ${transfer.recipient_full_name}`,
    currency: transfer.currency,
    status: transfer.status
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 w-full">
      <div className="w-full mx-auto space-y-6 px-4 py-4">
        <ProfileHeader profile={profile} />
        
        <BalanceCard balance={profile?.balance || 0} userCountry={profile?.country || "Cameroun"} />
        
        <ActionButtons onTransferClick={() => setShowTransferForm(true)} />
        <TransactionsCard transactions={transformedTransactions} onDeleteTransaction={() => {}} />
        
        {showTransferForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
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
        
        <WithdrawalRequestNotification
          isOpen={showSecureConfirmation}
          onClose={closeSecureConfirmation}
          onConfirm={handleSecureConfirm}
          onReject={handleSecureReject}
          requestData={selectedRequest}
        />
      </div>
    </div>
  );
};

export default Dashboard;
