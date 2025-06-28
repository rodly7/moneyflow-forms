
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, Eye, Users, Plus, BarChart3 } from "lucide-react";
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-purple-600 font-medium">Chargement du profil...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isSubAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 w-full">
      <div className="w-full mx-auto space-y-6 px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-purple-700">Sous-Administrateur</h1>
              <p className="text-purple-600">Bienvenue, {profile.full_name}</p>
            </div>
          </div>
          <Button onClick={handleSignOut} variant="ghost" className="text-red-600">
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex gap-2 bg-white p-2 rounded-lg shadow">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('overview')}
            className="flex-1"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Vue d'ensemble
          </Button>
          <Button
            variant={activeTab === 'users' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('users')}
            className="flex-1"
            disabled={!canViewUsers}
          >
            <Users className="w-4 h-4 mr-2" />
            Utilisateurs
          </Button>
          <Button
            variant={activeTab === 'deposits' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('deposits')}
            className="flex-1"
            disabled={!canDepositToAgent}
          >
            <Plus className="w-4 h-4 mr-2" />
            Dépôts Agent
          </Button>
        </div>

        {/* Contenu selon l'onglet actif */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Solde */}
            <Card className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6" />
                  <div>
                    <h2 className="text-lg font-bold">Solde</h2>
                    <p className="text-2xl font-bold">{formatCurrency(profile.balance, 'XAF')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistiques rapides */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Total Utilisateurs</p>
                      <p className="text-2xl font-bold">{users.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Shield className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Agents</p>
                      <p className="text-2xl font-bold">
                        {users.filter(u => u.role === 'agent').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Eye className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Accès Limité</p>
                      <p className="text-sm text-blue-600">Consultation seule</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Informations sur les limitations */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="text-yellow-800 text-lg">Limitations du Sous-Administrateur</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-yellow-700 space-y-2">
                  <p>• Vous pouvez uniquement <strong>consulter</strong> les informations des utilisateurs</p>
                  <p>• Vous ne pouvez pas modifier, supprimer ou bannir des comptes</p>
                  <p>• Vous ne pouvez pas changer les rôles des utilisateurs</p>
                  <p>• Vous ne pouvez pas effectuer de recharges automatiques</p>
                  <p>• Vous pouvez faire des dépôts vers les agents uniquement</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'users' && canViewUsers && (
          <div className="space-y-6">
            <Card>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Dépôts vers les Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    Fonctionnalité de dépôt vers les agents
                  </p>
                  <Button 
                    onClick={() => navigate('/agent-deposit')}
                    className="bg-purple-600 hover:bg-purple-700"
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
