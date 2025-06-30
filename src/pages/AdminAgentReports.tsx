
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, TrendingUp, Users, RefreshCw, Calendar, DollarSign, Activity } from "lucide-react";
import { useAgentReports } from "@/hooks/useAgentReports";
import { formatCurrency } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminAgentReports = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { reports, isLoading, error, generateAllReports, getReportsByPeriod } = useAgentReports();

  const dailyReports = getReportsByPeriod('daily');
  const weeklyReports = getReportsByPeriod('weekly');
  const monthlyReports = getReportsByPeriod('monthly');
  const yearlyReports = getReportsByPeriod('yearly');

  const handleRefresh = () => {
    generateAllReports();
    toast({
      title: "Actualisation",
      description: "Les rapports sont en cours de génération...",
    });
  };

  if (profile?.role !== 'admin') {
    navigate('/dashboard');
    return null;
  }

  const ReportCard = ({ report }: { report: any }) => (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-800">{report.agent_name}</span>
          <Badge variant="outline" className="text-xs">
            {report.period === 'daily' ? 'Jour' : 
             report.period === 'weekly' ? 'Semaine' : 
             report.period === 'monthly' ? 'Mois' : 'Année'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{report.totalTransfers}</p>
            <p className="text-xs text-blue-500">Transferts</p>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{report.totalWithdrawals}</p>
            <p className="text-xs text-green-500">Retraits</p>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm font-bold text-purple-600">
              {formatCurrency(report.currentBalance, 'XAF')}
            </p>
            <p className="text-xs text-purple-500">Solde actuel</p>
          </div>
          
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-sm font-bold text-orange-600">
              {formatCurrency(report.amountToAdd, 'XAF')}
            </p>
            <p className="text-xs text-orange-500">À ajouter</p>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Commissions:</span>
            <span className="font-semibold text-gray-800">
              {formatCurrency(report.totalCommissions, 'XAF')}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-600">Dépôts effectués:</span>
            <span className="font-semibold text-gray-800">{report.totalDeposits}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
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
              Rapports des Agents
            </h1>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* Status */}
        {isLoading && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-blue-800">Génération des rapports en cours...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <span className="text-red-800">❌ Erreur: {error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Rapports Journaliers</p>
                  <p className="text-2xl font-bold">{dailyReports.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Rapports Hebdomadaires</p>
                  <p className="text-2xl font-bold">{weeklyReports.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Rapports Mensuels</p>
                  <p className="text-2xl font-bold">{monthlyReports.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-600 to-red-600 text-white border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Rapports Annuels</p>
                  <p className="text-2xl font-bold">{yearlyReports.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Tabs */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-6">
            <Tabs defaultValue="daily" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="daily">Journalier</TabsTrigger>
                <TabsTrigger value="weekly">Hebdomadaire</TabsTrigger>
                <TabsTrigger value="monthly">Mensuel</TabsTrigger>
                <TabsTrigger value="yearly">Annuel</TabsTrigger>
              </TabsList>
              
              <TabsContent value="daily" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {dailyReports.map((report, index) => (
                    <ReportCard key={`daily-${index}`} report={report} />
                  ))}
                </div>
                {dailyReports.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-gray-500">
                    Aucun rapport journalier disponible
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="weekly" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {weeklyReports.map((report, index) => (
                    <ReportCard key={`weekly-${index}`} report={report} />
                  ))}
                </div>
                {weeklyReports.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-gray-500">
                    Aucun rapport hebdomadaire disponible
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="monthly" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {monthlyReports.map((report, index) => (
                    <ReportCard key={`monthly-${index}`} report={report} />
                  ))}
                </div>
                {monthlyReports.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-gray-500">
                    Aucun rapport mensuel disponible
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="yearly" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {yearlyReports.map((report, index) => (
                    <ReportCard key={`yearly-${index}`} report={report} />
                  ))}
                </div>
                {yearlyReports.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-gray-500">
                    Aucun rapport annuel disponible
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500">
          <CardContent className="p-4">
            <div className="space-y-2 text-sm text-blue-700">
              <p>• Les rapports sont générés automatiquement toutes les heures</p>
              <p>• Le montant cible pour les agents est fixé à 100 000 FCFA</p>
              <p>• Les commissions sont calculées sur la base des frais de transfert</p>
              <p>• Le système calcule automatiquement le montant à ajouter pour atteindre l'objectif</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAgentReports;
