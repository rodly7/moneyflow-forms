
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
import AutomaticWithdrawalConfirmation from "@/components/withdrawal/AutomaticWithdrawalConfirmation";
import { useWithdrawalConfirmations } from "@/hooks/useWithdrawalConfirmations";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { user, isAgent } = useAuth();
  const { toast } = useToast();
  const [showTransferForm, setShowTransferForm] = useState(false);

  // Utiliser le hook de confirmation de retrait
  const {
    pendingWithdrawals,
    selectedWithdrawal,
    showConfirmation,
    handleNotificationClick,
    handleConfirm,
    handleReject,
    closeConfirmation
  } = useWithdrawalConfirmations();

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 w-full">
      <div className="w-full mx-auto space-y-6 px-4 py-4">
        {/* Header sans icône de notification */}
        <ProfileHeader profile={profile} />
        
        <BalanceCard balance={profile?.balance || 0} userCountry={profile?.country || "Cameroun"} />
        
        {/* Section de confirmation de retrait pour les utilisateurs */}
        {!isAgent() && pendingWithdrawals.length > 0 && (
          <Card className="bg-orange-50 border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-orange-800 text-lg flex items-center gap-2">
                🔔 Confirmation de retrait requise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-orange-700 text-sm">
                  Vous avez {pendingWithdrawals.length} retrait(s) en attente de confirmation.
                </p>
                <Button
                  onClick={handleNotificationClick}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Confirmer le retrait de {pendingWithdrawals[0]?.amount} FCFA
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
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
        
        {showConfirmation && selectedWithdrawal && (
          <AutomaticWithdrawalConfirmation 
            withdrawal={selectedWithdrawal}
            onConfirm={handleConfirm}
            onReject={handleReject}
            onClose={closeConfirmation}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
