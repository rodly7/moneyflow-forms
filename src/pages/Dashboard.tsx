
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
import { LogOut, Settings, User, CreditCard, Sparkles } from "lucide-react";
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-6"></div>
          <p className="text-blue-600 font-medium text-lg">Chargement du tableau de bord...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-full relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-indigo-200/20 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 w-full mx-auto space-y-8 px-4 py-6">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between backdrop-blur-sm bg-white/70 rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <ProfileHeader profile={profile} />
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/verify-identity')}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 hover:border-blue-300 transition-all duration-200"
            >
              <User className="w-4 h-4 mr-2" />
              Profil
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/bill-payments')}
              className="text-green-600 hover:text-green-700 hover:bg-green-50 border border-green-200 hover:border-green-300 transition-all duration-200"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Factures
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 hover:border-red-300 transition-all duration-200"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
        
        {/* Enhanced Balance Card with backdrop */}
        <div className="backdrop-blur-sm bg-white/60 rounded-2xl p-1 shadow-xl border border-white/30">
          <BalanceCard balance={profile?.balance || 0} userCountry={profile?.country || "Cameroun"} />
        </div>
        
        {/* Enhanced Action Buttons */}
        <div className="backdrop-blur-sm bg-white/60 rounded-2xl p-6 shadow-xl border border-white/30">
          <ActionButtons onTransferClick={() => setShowTransferForm(true)} />
        </div>
        
        {/* Enhanced Transactions Card */}
        <div className="backdrop-blur-sm bg-white/60 rounded-2xl shadow-xl border border-white/30 overflow-hidden">
          <TransactionsCard 
            transactions={transformedTransactions} 
            onDeleteTransaction={() => {}}
            isLoading={transfersLoading}
          />
        </div>
        
        {/* Enhanced Transfer Form Modal */}
        {showTransferForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-white/30 animate-scale-in">
              <TransferForm />
              <div className="p-6 border-t border-gray-100">
                <Button 
                  onClick={() => setShowTransferForm(false)}
                  variant="outline"
                  className="w-full h-12 border-2 border-gray-200 hover:border-red-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
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
