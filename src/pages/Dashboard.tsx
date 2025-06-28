
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center space-y-6 p-8">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-500/30 border-t-blue-500 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <p className="text-blue-600 font-semibold text-xl">Chargement du tableau de bord</p>
            <p className="text-gray-500">Préparation de votre espace personnel...</p>
          </div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-300/10 to-blue-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 w-full mx-auto space-y-8 px-4 py-6 max-w-6xl">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between backdrop-blur-xl bg-white/80 rounded-3xl p-6 shadow-2xl border border-white/50 hover:shadow-3xl transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <ProfileHeader profile={profile} />
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/verify-identity')}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50/80 border border-blue-200 hover:border-blue-300 transition-all duration-300 rounded-full px-4 py-2 backdrop-blur-sm"
            >
              <User className="w-4 h-4 mr-2" />
              Profil
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/bill-payments')}
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/80 border border-emerald-200 hover:border-emerald-300 transition-all duration-300 rounded-full px-4 py-2 backdrop-blur-sm"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Factures
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-700 hover:bg-red-50/80 border border-red-200 hover:border-red-300 transition-all duration-300 rounded-full px-4 py-2 backdrop-blur-sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
        
        {/* Enhanced Balance Card */}
        <div className="backdrop-blur-xl bg-white/70 rounded-3xl p-1 shadow-2xl border border-white/40 hover:shadow-3xl transition-all duration-300">
          <BalanceCard balance={profile?.balance || 0} userCountry={profile?.country || "Cameroun"} />
        </div>
        
        {/* Enhanced Action Buttons */}
        <div className="backdrop-blur-xl bg-white/70 rounded-3xl p-8 shadow-2xl border border-white/40 hover:shadow-3xl transition-all duration-300">
          <ActionButtons onTransferClick={() => setShowTransferForm(true)} />
        </div>
        
        {/* Enhanced Transactions Card */}
        <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/40 overflow-hidden hover:shadow-3xl transition-all duration-300">
          <TransactionsCard 
            transactions={transformedTransactions} 
            onDeleteTransaction={() => {}}
            isLoading={transfersLoading}
          />
        </div>
        
        {/* Enhanced Transfer Form Modal */}
        {showTransferForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-3xl border border-white/50 animate-scale-in">
              <TransferForm />
              <div className="p-6 border-t border-gray-100">
                <Button 
                  onClick={() => setShowTransferForm(false)}
                  variant="outline"
                  className="w-full h-12 border-2 border-gray-200 hover:border-red-400 hover:bg-red-50 hover:text-red-600 transition-all duration-300 rounded-full"
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
