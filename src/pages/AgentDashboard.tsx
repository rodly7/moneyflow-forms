
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
  Clock
} from 'lucide-react';

const AgentDashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  if (!profile || profile.role !== 'agent') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accès refusé</CardTitle>
            <CardDescription>
              Cette page est réservée aux agents.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Tableau de bord Agent
              </h1>
              <p className="text-gray-600">
                Bienvenue, {profile.full_name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Solde disponible</p>
              <p className="text-2xl font-bold text-green-600">
                {profile.balance.toLocaleString()} FCFA
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Transactions du jour
              </CardTitle>
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Aucune transaction aujourd'hui
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Commissions gagnées
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0 FCFA</div>
              <p className="text-xs text-muted-foreground">
                Ce mois-ci
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Clients servis
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>
              Gérez vos opérations d'agent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                onClick={() => navigate('/agent-services')}
                className="h-20 flex-col space-y-2"
                variant="outline"
              >
                <Wallet className="h-6 w-6" />
                <span className="text-sm">Dépôt/Retrait</span>
              </Button>

              <Button 
                onClick={() => navigate('/agent-withdrawal')}
                className="h-20 flex-col space-y-2"
                variant="outline"
              >
                <ArrowUpDown className="h-6 w-6" />
                <span className="text-sm">Retrait Client</span>
              </Button>

              <Button 
                onClick={() => navigate('/transactions')}
                className="h-20 flex-col space-y-2"
                variant="outline"
              >
                <Clock className="h-6 w-6" />
                <span className="text-sm">Historique</span>
              </Button>

              <Button 
                onClick={() => navigate('/commission')}
                className="h-20 flex-col space-y-2"
                variant="outline"
              >
                <TrendingUp className="h-6 w-6" />
                <span className="text-sm">Commissions</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>
              Vos dernières transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune activité récente</p>
              <p className="text-sm">Vos transactions apparaîtront ici</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentDashboard;
