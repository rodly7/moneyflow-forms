import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, DollarSign, TrendingUp, Activity, MapPin, Wifi } from 'lucide-react';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import AgentsPerformanceTable from '@/components/admin/AgentsPerformanceTable';
import CommissionSummaryCard from '@/components/admin/CommissionSummaryCard';
import AnomaliesCard from '@/components/admin/AnomaliesCard';
import AgentLocationMap from '@/components/admin/AgentLocationMap';
import OnlineUsersCard from '@/components/admin/OnlineUsersCard';
import { useActiveAgentLocations } from '@/hooks/useAgentLocations';

const EnhancedMainAdminDashboard = () => {
  const { data: dashboardData, isLoading } = useAdminDashboardData();
  const { data: agentLocations, isLoading: isLoadingLocations } = useActiveAgentLocations();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Tableau de Bord Administrateur
          </h1>
          <p className="text-gray-600 mt-2">Vue d'ensemble des performances et activités</p>
        </div>

        {/* Première ligne - Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Utilisateurs en ligne */}
          <OnlineUsersCard />
          
          {/* Commissions */}
          <CommissionSummaryCard data={dashboardData} isLoading={isLoading} />
          
          {/* Activité */}
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Activité Système
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Total agents</span>
                  <Badge variant="outline" className="border-green-500 text-green-700">
                    {dashboardData?.totalAgents || 0}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Agents localisés</span>
                  <Badge variant="outline" className="border-green-500 text-green-700">
                    {agentLocations?.length || 0}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Anomalies */}
          <AnomaliesCard anomalies={dashboardData?.anomalies || []} isLoading={isLoading} />
        </div>

        {/* Deuxième ligne - Géolocalisation */}
        <div className="grid grid-cols-1 xl:grid-cols-1 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">Géolocalisation des Agents</h2>
              <Badge variant="outline" className="ml-auto">
                <Wifi className="w-3 h-3 mr-1" />
                {agentLocations?.filter(a => a.is_active).length || 0} actifs
              </Badge>
            </div>
            <AgentLocationMap 
              agents={agentLocations || []} 
              isLoading={isLoadingLocations}
            />
          </div>
        </div>

        {/* Troisième ligne - Tableaux détaillés */}
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Performance des Agents
            </h2>
            <AgentsPerformanceTable agents={dashboardData?.agents || []} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMainAdminDashboard;