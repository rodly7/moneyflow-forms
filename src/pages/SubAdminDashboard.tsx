
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, Eye, Users, Plus, BarChart3, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/integrations/supabase/client";
import { supabase } from "@/integrations/supabase/client";
import { useSubAdmin } from "@/hooks/useSubAdmin";
import SubAdminUsersTable from "@/components/admin/SubAdminUsersTable";

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

const SubAdminDashboard = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSubAdmin, canViewUsers, canDepositToAgent } = useSubAdmin();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'deposits'>('overview');
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const fetchUsers = async () => {
    if (!canViewUsers) return;
    
    setIsLoadingUsers(true);
    try {
      const { data: usersData, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setUsers(usersData || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer la liste des utilisateurs",
        variant: "destructive"
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto backdrop-blur-xl bg-white/80 shadow-2xl border border-white/50 rounded-3xl">
          <CardContent className="pt-8">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/30 border-t-purple-500 mx-auto"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-pulse"></div>
              </div>
              <p className="text-purple-600 font-semibold text-xl">Chargement du profil...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isSubAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto backdrop-blur-xl bg-white/80 shadow-2xl border border-white/50 rounded-3xl">
          <CardContent className="pt-8">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-600 mb-4">Accès refusé</h2>
                <p className="text-gray-600 mb-4">Cette interface est réservée aux sous-administrateurs.</p>
                <Button onClick={() => navigate('/dashboard')} className="w-full rounded-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg">
                  Retour au tableau de bord
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full mx-auto space-y-8 px-4 py-6 max-w-6xl">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between backdrop-blur-xl bg-white/80 rounded-3xl p-6 shadow-2xl border border-white/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Sous-Administrateur</h1>
              <p className="text-purple-600 text-lg">Bienvenue, {profile.full_name}</p>
            </div>
          </div>
          <Button 
            onClick={handleSignOut} 
            variant="ghost" 
            className="text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300 rounded-full px-6 py-3 transition-all duration-300"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>

        {/* Enhanced Navigation */}
        <div className="flex gap-3 bg-white/80 backdrop-blur-xl p-3 rounded-2xl shadow-xl border border-white/50">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('overview')}
            className="rounded-full px-6 py-3 transition-all duration-300"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Vue d'ensemble
          </Button>
          <Button
            variant={activeTab === 'users' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('users')}
            disabled={!canViewUsers}
            className="rounded-full px-6 py-3 transition-all duration-300"
          >
            <Users className="w-4 h-4 mr-2" />
            Utilisateurs
          </Button>
          <Button
            variant={activeTab === 'deposits' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('deposits')}
            disabled={!canDepositToAgent}
            className="rounded-full px-6 py-3 transition-all duration-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            Dépôts Agent
          </Button>
        </div>

        {/* Contenu selon l'onglet actif */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Enhanced Balance Card */}
            <Card className="bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 text-white border-0 shadow-2xl rounded-3xl">
              <CardContent className="pt-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-purple-100">Solde</h2>
                    <p className="text-3xl font-bold drop-shadow-lg">{formatCurrency(profile.balance, 'XAF')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="backdrop-blur-xl bg-white/80 shadow-xl border border-white/50 rounded-2xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="pt-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Total Utilisateurs</p>
                      <p className="text-3xl font-bold text-purple-600">{users.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="backdrop-blur-xl bg-white/80 shadow-xl border border-white/50 rounded-2xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="pt-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Agents</p>
                      <p className="text-3xl font-bold text-emerald-600">
                        {users.filter(u => u.role === 'agent').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="backdrop-blur-xl bg-white/80 shadow-xl border border-white/50 rounded-2xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="pt-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Accès Limité</p>
                      <p className="text-sm text-blue-600 font-semibold">Consultation seule</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Limitations Card */}
            <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="text-yellow-800 text-xl flex items-center gap-3">
                  <Sparkles className="w-6 h-6" />
                  Limitations du Sous-Administrateur
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-yellow-700 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <p>Vous pouvez uniquement <strong>consulter</strong> les informations des utilisateurs</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <p>Vous ne pouvez pas modifier, supprimer ou bannir des comptes</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <p>Vous ne pouvez pas changer les rôles des utilisateurs</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <p>Vous ne pouvez pas effectuer de recharges automatiques</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p>Vous pouvez faire des dépôts vers les agents uniquement</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'users' && canViewUsers && (
          <div className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/90 shadow-2xl border border-white/50 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Consultation des Utilisateurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                    <p>Chargement des utilisateurs...</p>
                  </div>
                ) : (
                  <SubAdminUsersTable users={users} />
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'deposits' && canDepositToAgent && (
          <div className="space-y-6">
            <Card className="backdrop-blur-xl bg-white/90 shadow-2xl border border-white/50 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Dépôts vers les Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Plus className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-600 mb-6 text-lg">
                    Fonctionnalité de dépôt vers les agents
                  </p>
                  <Button 
                    onClick={() => navigate('/agent-deposit')}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full px-8 py-3 h-12 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    Accéder aux dépôts agent
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubAdminDashboard;
