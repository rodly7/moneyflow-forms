import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, TrendingUp, Building2, ArrowLeft, Settings, User, Eye, Activity, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import ProfileHeader from "@/components/dashboard/ProfileHeader";
import SubAdminUsersTable from "@/components/admin/SubAdminUsersTable";
import BatchAgentDeposit from "@/components/admin/BatchAgentDeposit";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";

interface CommissionData {
  agent_transfer_commission: number;
  agent_withdrawal_commission: number;
  agent_total_commission: number;
  enterprise_transfer_commission: number;
  enterprise_withdrawal_commission: number;
  enterprise_total_commission: number;
}

const SubAdminDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const deviceInfo = useDeviceDetection();
  const [selectedOperation, setSelectedOperation] = useState<'batch-deposit' | 'view-data' | 'view-users' | null>(null);

  // Récupérer les utilisateurs (lecture seule pour les sous-admins)
  const { data: users } = useQuery({
    queryKey: ['all-users-sub-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, balance, country, role, created_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Récupérer les commissions (lecture seule)
  const { data: commissions } = useQuery({
    queryKey: ['sub-admin-commissions'],
    queryFn: async () => {
      const [transfersRes, withdrawalsRes] = await Promise.all([
        supabase.from('transfers').select('amount, created_at').eq('status', 'completed'),
        supabase.from('withdrawals').select('amount, created_at').eq('status', 'completed')
      ]);

      const transfers = transfersRes.data || [];
      const withdrawals = withdrawalsRes.data || [];

      const transferTotalAmount = transfers.reduce((sum, transfer) => sum + transfer.amount, 0);
      const withdrawalTotalAmount = withdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0);

      const agentTransferCommission = transferTotalAmount * 0.015;
      const enterpriseTransferCommission = transferTotalAmount * 0.05;
      const agentWithdrawalCommission = withdrawalTotalAmount * 0.01;
      const enterpriseWithdrawalCommission = withdrawalTotalAmount * 0.015;

      return {
        agent_transfer_commission: agentTransferCommission,
        agent_withdrawal_commission: agentWithdrawalCommission,
        agent_total_commission: agentTransferCommission + agentWithdrawalCommission,
        enterprise_transfer_commission: enterpriseTransferCommission,
        enterprise_withdrawal_commission: enterpriseWithdrawalCommission,
        enterprise_total_commission: enterpriseTransferCommission + enterpriseWithdrawalCommission,
      } as CommissionData;
    },
  });

  // Récupérer les statistiques
  const { data: stats } = useQuery({
    queryKey: ['sub-admin-stats'],
    queryFn: async () => {
      const [transfersRes, withdrawalsRes, rechargesRes] = await Promise.all([
        supabase.from('transfers').select('id, amount, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('withdrawals').select('id, amount, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('recharges').select('id, amount, created_at').order('created_at', { ascending: false }).limit(5)
      ]);

      return {
        transfers: transfersRes.data || [],
        withdrawals: withdrawalsRes.data || [],
        recharges: rechargesRes.data || []
      };
    },
  });

  // Vérifier les permissions
  if (!profile || profile.role !== 'sub_admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-red-600 mb-4">Accès refusé</h2>
              <p className="text-gray-600 mb-4">Cette interface est réservée aux sous-administrateurs.</p>
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Retour au tableau de bord
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Configuration responsive
  const getGridColumns = () => {
    if (deviceInfo.isMobile) return "grid-cols-1";
    if (deviceInfo.isTablet) return "grid-cols-2";
    return "grid-cols-1 md:grid-cols-2";
  };

  const getActionGridColumns = () => {
    if (deviceInfo.isMobile) return "grid-cols-1";
    if (deviceInfo.isTablet) return "grid-cols-2";
    return "grid-cols-1 md:grid-cols-3";
  };

  const getSpacing = () => {
    if (deviceInfo.isMobile) return "space-y-3 px-3 py-3";
    if (deviceInfo.isTablet) return "space-y-4 px-4 py-4";
    return "space-y-4 px-4 py-4";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 w-full">
      <div className={`w-full mx-auto ${getSpacing()}`}>
        {/* Profile Header */}
        <ProfileHeader profile={profile} />

        {/* Sub-Admin Badge & Balance - Responsive */}
        <div className={`grid ${getGridColumns()} gap-3 md:gap-4`}>
          <Card className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
            <CardContent className={`${deviceInfo.isMobile ? 'pt-3 pb-3' : 'pt-4 pb-4'}`}>
              <div className="flex items-center gap-3">
                <Settings className={`${deviceInfo.isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
                <div>
                  <h2 className={`${deviceInfo.isMobile ? 'text-base' : 'text-lg'} font-bold`}>Sous-Administrateur</h2>
                  <p className={`${deviceInfo.isMobile ? 'text-xs' : 'text-xs'} text-orange-100`}>Interface de gestion limitée</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className={`${deviceInfo.isMobile ? 'pt-3 pb-3' : 'pt-4 pb-4'}`}>
              <div className="flex items-center gap-3">
                <Wallet className={`${deviceInfo.isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-blue-600`} />
                <div>
                  <p className="text-xs text-gray-600">Solde</p>
                  <p className={`${deviceInfo.isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900`}>
                    {formatCurrency(profile.balance, 'XAF')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Commissions Display (Lecture seule) - Responsive */}
        {!selectedOperation && commissions && (
          <div className={`grid ${getGridColumns()} gap-3 md:gap-4`}>
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <CardContent className={`${deviceInfo.isMobile ? 'pt-3 pb-3' : 'pt-4 pb-4'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className={`${deviceInfo.isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-emerald-600`} />
                    <h3 className={`${deviceInfo.isMobile ? 'text-sm' : 'font-semibold'} text-emerald-800`}>Commission Agents</h3>
                  </div>
                  <p className={`${deviceInfo.isMobile ? 'text-lg' : 'text-xl'} font-bold text-emerald-600`}>
                    {formatCurrency(commissions.agent_total_commission, 'XAF')}
                  </p>
                </div>
                <div className={`mt-2 ${deviceInfo.isMobile ? 'text-xs' : 'text-sm'} text-emerald-700`}>
                  <p>Transferts: {formatCurrency(commissions.agent_transfer_commission, 'XAF')}</p>
                  <p>Retraits: {formatCurrency(commissions.agent_withdrawal_commission, 'XAF')}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className={`${deviceInfo.isMobile ? 'pt-3 pb-3' : 'pt-4 pb-4'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className={`${deviceInfo.isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600`} />
                    <h3 className={`${deviceInfo.isMobile ? 'text-sm' : 'font-semibold'} text-blue-800`}>Commission Entreprise</h3>
                  </div>
                  <p className={`${deviceInfo.isMobile ? 'text-lg' : 'text-xl'} font-bold text-blue-600`}>
                    {formatCurrency(commissions.enterprise_total_commission, 'XAF')}
                  </p>
                </div>
                <div className={`mt-2 ${deviceInfo.isMobile ? 'text-xs' : 'text-sm'} text-blue-700`}>
                  <p>Transferts: {formatCurrency(commissions.enterprise_transfer_commission, 'XAF')}</p>
                  <p>Retraits: {formatCurrency(commissions.enterprise_withdrawal_commission, 'XAF')}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions - Responsive */}
        {!selectedOperation && (
          <div className={`grid ${getActionGridColumns()} gap-2 md:gap-3`}>
            <Card 
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105 bg-white border-l-4 border-l-emerald-500"
              onClick={() => setSelectedOperation('batch-deposit')}
            >
              <CardContent className={`${deviceInfo.isMobile ? 'pt-3 pb-3' : 'pt-4 pb-4'} text-center`}>
                <Users className={`${deviceInfo.isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-emerald-600 mx-auto mb-2`} />
                <p className={`${deviceInfo.isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-900`}>Dépôt en Lot</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105 bg-white border-l-4 border-l-purple-500"
              onClick={() => setSelectedOperation('view-users')}
            >
              <CardContent className={`${deviceInfo.isMobile ? 'pt-3 pb-3' : 'pt-4 pb-4'} text-center`}>
                <Eye className={`${deviceInfo.isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-purple-600 mx-auto mb-2`} />
                <p className={`${deviceInfo.isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-900`}>Voir Utilisateurs</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105 bg-white border-l-4 border-l-indigo-500"
              onClick={() => setSelectedOperation('view-data')}
            >
              <CardContent className={`${deviceInfo.isMobile ? 'pt-3 pb-3' : 'pt-4 pb-4'} text-center`}>
                <Activity className={`${deviceInfo.isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-indigo-600 mx-auto mb-2`} />
                <p className={`${deviceInfo.isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-900`}>Données</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Batch Agent Deposit */}
        {selectedOperation === 'batch-deposit' && (
          <BatchAgentDeposit onBack={() => setSelectedOperation(null)} />
        )}

        {/* View Users (Lecture seule) */}
        {selectedOperation === 'view-users' && (
          <Card className="bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Eye className="w-5 h-5 text-purple-600" />
                  Consultation des Utilisateurs
                </CardTitle>
                <Button onClick={() => setSelectedOperation(null)} variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-orange-800 mb-2">Mode consultation uniquement:</h3>
                  <ul className="text-sm text-orange-700 space-y-1">
                    <li>• Vous pouvez voir tous les utilisateurs et leurs informations</li>
                    <li>• Vous ne pouvez pas modifier, supprimer ou bannir les utilisateurs</li>
                    <li>• Vous ne pouvez pas changer les rôles</li>
                    <li>• Pour les modifications, contactez l'administrateur principal</li>
                  </ul>
                </div>
                
                {users && users.length > 0 ? (
                  <div className={deviceInfo.isMobile ? "overflow-x-auto" : ""}>
                    <SubAdminUsersTable users={users} />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Aucun utilisateur trouvé</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Overview */}
        {selectedOperation === 'view-data' && (
          <Card className="bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  Aperçu des données
                </CardTitle>
                <Button onClick={() => setSelectedOperation(null)} variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`grid ${deviceInfo.isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'} gap-4`}>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Transferts récents</h3>
                  <div className="space-y-2">
                    {stats?.transfers.slice(0, 3).map((transfer) => (
                      <div key={transfer.id} className="text-sm">
                        <span className="font-medium">{formatCurrency(transfer.amount, 'XAF')}</span>
                        <span className="text-gray-600 ml-2">
                          {new Date(transfer.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">Retraits récents</h3>
                  <div className="space-y-2">
                    {stats?.withdrawals.slice(0, 3).map((withdrawal) => (
                      <div key={withdrawal.id} className="text-sm">
                        <span className="font-medium">{formatCurrency(withdrawal.amount, 'XAF')}</span>
                        <span className="text-gray-600 ml-2">
                          {new Date(withdrawal.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Recharges récentes</h3>
                  <div className="space-y-2">
                    {stats?.recharges.slice(0, 3).map((recharge) => (
                      <div key={recharge.id} className="text-sm">
                        <span className="font-medium">{formatCurrency(recharge.amount, 'XAF')}</span>
                        <span className="text-gray-600 ml-2">
                          {new Date(recharge.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Users List (Lecture seule) */}
        {!selectedOperation && (
          <Card className="bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <User className="w-5 h-5 text-blue-600" />
                Utilisateurs récents (Consultation)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {users?.slice(0, 5).map((user) => (
                  <div 
                    key={user.id}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className={`${deviceInfo.isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-900`}>{user.full_name || 'Nom non disponible'}</p>
                        <p className={`${deviceInfo.isMobile ? 'text-xs' : 'text-xs'} text-gray-600`}>{user.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`${deviceInfo.isMobile ? 'text-xs' : 'text-sm'} font-semibold text-blue-600`}>
                        {formatCurrency(user.balance, 'XAF')}
                      </p>
                      <span className="text-xs text-gray-500">
                        {user.role === 'agent' ? 'Agent' : user.role === 'admin' ? 'Admin' : user.role === 'sub_admin' ? 'Sous-Admin' : 'User'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SubAdminDashboard;
