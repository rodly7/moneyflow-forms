
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  TrendingUp, 
  Wallet, 
  ArrowUpDown,
  DollarSign,
  Clock,
  Eye,
  EyeOff,
  RefreshCw,
  LogOut,
  Settings,
  BarChart3,
  PiggyBank,
  Receipt
} from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '@/integrations/supabase/client';

const AgentDashboard = () => {
  const { profile, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);

  if (!profile || profile.role !== 'agent') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-blue-600">Accès refusé</CardTitle>
            <CardDescription>
              Cette page est réservée aux agents.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const displayBalance = showBalance 
    ? formatCurrency(profile.balance || 0, 'XAF')
    : '••••••';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header avec profil agent */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  Espace Agent
                </h1>
                <p className="text-blue-100">
                  Bienvenue, {profile.full_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/verify-identity')}
                className="text-white hover:bg-white/20"
              >
                <Settings className="w-4 h-4 mr-2" />
                Paramètres
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-white hover:bg-white/20"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Affichage du solde */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-6 h-6" />
                <h3 className="font-medium text-blue-100">
                  Solde Agent Disponible
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-white/80 hover:text-white hover:bg-white/20 p-2"
                >
                  {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/80 hover:text-white hover:bg-white/20 p-2"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="text-3xl font-bold mb-2">
              {displayBalance}
            </div>
            <p className="text-blue-100 text-sm">
              Dernière mise à jour: maintenant
            </p>
          </CardContent>
        </Card>

        {/* Statistiques des transactions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-blue-200 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">
                Transactions Aujourd'hui
              </CardTitle>
              <ArrowUpDown className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">0</div>
              <p className="text-xs text-blue-600 mt-1">
                Aucune transaction
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">
                Commissions Gagnées
              </CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">0 FCFA</div>
              <p className="text-xs text-blue-600 mt-1">
                Ce mois-ci
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">
                Clients Servis
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">0</div>
              <p className="text-xs text-blue-600 mt-1">
                Total
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">
                Volume du Mois
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800">0 FCFA</div>
              <p className="text-xs text-blue-600 mt-1">
                Transactions totales
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides */}
        <Card className="border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-blue-700 flex items-center gap-2">
              <PiggyBank className="w-5 h-5" />
              Actions Rapides Agent
            </CardTitle>
            <CardDescription className="text-blue-600">
              Gérez efficacement vos opérations d'agent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                onClick={() => navigate('/agent-services')}
                className="h-24 flex-col space-y-3 bg-blue-600 hover:bg-blue-700 text-white shadow-md"
              >
                <Wallet className="h-7 w-7" />
                <span className="text-sm font-medium">Dépôt/Retrait</span>
              </Button>

              <Button 
                onClick={() => navigate('/agent-withdrawal')}
                className="h-24 flex-col space-y-3 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
              >
                <ArrowUpDown className="h-7 w-7" />
                <span className="text-sm font-medium">Retrait Client</span>
              </Button>

              <Button 
                onClick={() => navigate('/transactions')}
                className="h-24 flex-col space-y-3 bg-blue-500 hover:bg-blue-600 text-white shadow-md"
              >
                <Clock className="h-7 w-7" />
                <span className="text-sm font-medium">Historique</span>
              </Button>

              <Button 
                onClick={() => navigate('/commission')}
                className="h-24 flex-col space-y-3 bg-green-600 hover:bg-green-700 text-white shadow-md"
              >
                <Receipt className="h-7 w-7" />
                <span className="text-sm font-medium">Commissions</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section d'activité récente */}
        <Card className="border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-blue-700 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Activité Récente
            </CardTitle>
            <CardDescription className="text-blue-600">
              Vos dernières opérations et transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-blue-400" />
              </div>
              <p className="text-blue-600 text-lg font-medium mb-2">
                Aucune activité récente
              </p>
              <p className="text-blue-500 text-sm">
                Vos transactions et opérations apparaîtront ici
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Graphique des performances (placeholder) */}
        <Card className="border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-blue-700 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performances de la Semaine
            </CardTitle>
            <CardDescription className="text-blue-600">
              Évolution de vos commissions et transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-blue-300 mx-auto mb-3" />
                <p className="text-blue-600 font-medium">Graphique bientôt disponible</p>
                <p className="text-blue-500 text-sm">Vos statistiques s'afficheront ici</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentDashboard;
