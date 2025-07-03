
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, Wallet, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import UsersDataTable from "@/components/admin/UsersDataTable";
import AdminSelfRecharge from "@/components/admin/AdminSelfRecharge";
import BatchAgentDeposit from "@/components/admin/BatchAgentDeposit";
import UserManagementModal from "@/components/admin/UserManagementModal";

interface UserData {
  id: string;
  full_name: string | null;
  phone: string;
  balance: number;
  country: string | null;
  role: 'user' | 'agent' | 'admin' | 'sub_admin';
  is_banned?: boolean;
  banned_reason?: string | null;
  created_at: string;
}

const AdminUsers = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBatchDeposit, setShowBatchDeposit] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchUsers();
  }, [profile, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRoleChange = async (userId: string, newRole: 'user' | 'agent' | 'admin' | 'sub_admin') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      // Mettre à jour la liste locale
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));

      toast({
        title: "Rôle mis à jour",
        description: `Le rôle a été changé vers ${newRole}`,
      });
    } catch (error) {
      console.error("Erreur lors du changement de rôle:", error);
      toast({
        title: "Erreur",
        description: "Impossible de changer le rôle",
        variant: "destructive"
      });
    }
  };

  const handleQuickBanToggle = async (userId: string, currentBanStatus: boolean) => {
    try {
      const newBanStatus = !currentBanStatus;
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_banned: newBanStatus,
          banned_at: newBanStatus ? new Date().toISOString() : null,
          banned_reason: newBanStatus ? 'Banni par l\'administrateur' : null
        })
        .eq('id', userId);

      if (error) throw error;

      // Mettre à jour la liste locale
      setUsers(prev => prev.map(user => 
        user.id === userId ? { 
          ...user, 
          is_banned: newBanStatus,
          banned_reason: newBanStatus ? 'Banni par l\'administrateur' : null
        } : user
      ));

      toast({
        title: newBanStatus ? "Utilisateur banni" : "Utilisateur débanni",
        description: newBanStatus ? "L'utilisateur a été banni avec succès" : "L'utilisateur a été débanni avec succès",
      });
    } catch (error) {
      console.error("Erreur lors du bannissement:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut de bannissement",
        variant: "destructive"
      });
    }
  };

  const handleViewUser = (user: UserData) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleAutoBatchDeposit = async () => {
    try {
      // Récupérer les agents avec un solde < 50,000
      const { data: lowBalanceAgents, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'agent')
        .lt('balance', 50000);

      if (error) throw error;

      if (!lowBalanceAgents || lowBalanceAgents.length === 0) {
        toast({
          title: "Aucun agent trouvé",
          description: "Aucun agent n'a un solde inférieur à 50,000 FCFA",
        });
        return;
      }

      const depositAmount = 50000;
      const totalAmount = depositAmount * lowBalanceAgents.length;

      // Vérifier le solde de l'admin
      if (profile && profile.balance < totalAmount) {
        toast({
          title: "Solde insuffisant",
          description: `Solde requis: ${totalAmount.toLocaleString()} FCFA`,
          variant: "destructive"
        });
        return;
      }

      // Effectuer les dépôts
      for (const agent of lowBalanceAgents) {
        await supabase.rpc('increment_balance', {
          user_id: agent.id,
          amount: depositAmount
        });
      }

      // Débiter l'admin
      await supabase.rpc('increment_balance', {
        user_id: profile?.id,
        amount: -totalAmount
      });

      toast({
        title: "Dépôts automatiques effectués",
        description: `${lowBalanceAgents.length} agent(s) rechargé(s) de 50,000 FCFA chacun`,
      });

      fetchUsers();
    } catch (error) {
      console.error('Erreur lors du dépôt automatique:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du dépôt automatique",
        variant: "destructive"
      });
    }
  };

  if (!profile || profile.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-none">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 w-full">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/main-admin')}
              className="hover:bg-white/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Gestion Administrative
            </h1>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm shadow-lg rounded-xl h-14">
            <TabsTrigger value="users" className="flex items-center gap-2 h-10">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Utilisateurs</span>
            </TabsTrigger>
            <TabsTrigger value="batch-deposit" className="flex items-center gap-2 h-10">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Dépôts Agents</span>
            </TabsTrigger>
            <TabsTrigger value="self-recharge" className="flex items-center gap-2 h-10">
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">Mon Solde</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6 w-full">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Gestion des Utilisateurs
                </CardTitle>
              </CardHeader>
              <CardContent className="w-full overflow-x-auto">
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                ) : (
                  <div className="w-full">
                    <UsersDataTable 
                      users={users}
                      onViewUser={handleViewUser}
                      onQuickRoleChange={handleQuickRoleChange}
                      onQuickBanToggle={handleQuickBanToggle}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="batch-deposit" className="space-y-6 w-full">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Dépôts en Lot pour Agents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={handleAutoBatchDeposit}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Dépôt Auto (Agents &lt; 50k)
                  </Button>
                  <Button
                    onClick={() => setShowBatchDeposit(true)}
                    variant="outline"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Dépôt Manuel Personnalisé
                  </Button>
                </div>
                
                {showBatchDeposit && (
                  <BatchAgentDeposit onBack={() => setShowBatchDeposit(false)} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="self-recharge" className="space-y-6 w-full">
            <div className="w-full">
              <AdminSelfRecharge />
            </div>
          </TabsContent>
        </Tabs>

        {/* Modal de gestion des utilisateurs */}
        <UserManagementModal
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onUserUpdated={fetchUsers}
        />
      </div>
    </div>
  );
};

export default AdminUsers;
