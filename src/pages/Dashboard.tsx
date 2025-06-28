
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
import { LogOut, Settings, User, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [showTransferForm, setShowTransferForm] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: transfers, isLoading: transfersLoading } = useQuery({
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

  // Rafraîchir le profil
  useQuery({
    queryKey: ['profile-refresh', user?.id],
    queryFn: async () => {
      await refreshProfile();
      return true;
    },
    enabled: !!user,
    refetchInterval: 5 * 60 * 1000,
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

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
        {/* Header avec options utilisateur */}
        <div className="flex items-center justify-between">
          <ProfileHeader profile={profile} />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/verify-identity')}
              className="text-blue-600 hover:text-blue-700"
            >
              <User className="w-4 h-4 mr-1" />
              Profil
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/bill-payments')}
              className="text-green-600 hover:text-green-700"
            >
              <CreditCard className="w-4 h-4 mr-1" />
              Factures
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-700"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Déconnexion
            </Button>
          </div>
        </div>
        
        <BalanceCard balance={profile?.balance || 0} userCountry={profile?.country || "Cameroun"} />
        
        <ActionButtons onTransferClick={() => setShowTransferForm(true)} />
        
        <TransactionsCard 
          transactions={transformedTransactions} 
          onDeleteTransaction={() => {}}
          isLoading={transfersLoading}
        />
        
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
      </div>
    </div>
  );
};

export default Dashboard;
