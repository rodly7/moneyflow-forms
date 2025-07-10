
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, DollarSign, TrendingUp, Activity } from 'lucide-react';

const MainAdminDashboard = () => {
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

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Utilisateurs Actifs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-600">En ligne</span>
                  <Badge variant="outline" className="border-blue-500 text-blue-700">
                    128
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-600">Total agents</span>
                  <Badge variant="outline" className="border-blue-500 text-blue-700">
                    45
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Revenus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600">Aujourd'hui</span>
                  <Badge variant="outline" className="border-emerald-500 text-emerald-700">
                    2.4M XAF
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600">Ce mois</span>
                  <Badge variant="outline" className="border-emerald-500 text-emerald-700">
                    68.2M XAF
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-orange-600">Aujourd'hui</span>
                  <Badge variant="outline" className="border-orange-500 text-orange-700">
                    1,247
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-orange-600">Ce mois</span>
                  <Badge variant="outline" className="border-orange-500 text-orange-700">
                    34,891
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-purple-600">Taux de réussite</span>
                  <Badge variant="outline" className="border-purple-500 text-purple-700">
                    98.7%
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-purple-600">Satisfaction</span>
                  <Badge variant="outline" className="border-purple-500 text-purple-700">
                    4.9/5
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message informatif */}
        <Card className="bg-white/80 backdrop-blur border-gray-200">
          <CardContent className="pt-6">
            <div className="text-center text-gray-600">
              <p className="text-lg font-medium mb-2">Tableau de bord en développement</p>
              <p className="text-sm">Les fonctionnalités avancées seront disponibles prochainement.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MainAdminDashboard;
