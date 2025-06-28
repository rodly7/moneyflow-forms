
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Wallet, 
  ArrowRight,
  LogOut,
  Eye,
  EyeOff,
  BarChart3,
  PlusCircle,
  MinusCircle,
  Receipt
} from 'lucide-react';
import { formatCurrency } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const NewAgentDashboard = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showBalance, setShowBalance] = useState(true);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-blue-600">Chargement...</CardTitle>
            <CardDescription>Chargement de votre profil agent...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (profile.role !== 'agent') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Accès refusé</CardTitle>
            <CardDescription>
              Cette page est réservée aux agents. Votre rôle: {profile.role}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/agent-auth');
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

  const displayBalance = showBalance 
    ? formatCurrency(profile.balance || 0, 'XAF')
    : '••••••';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header Agent */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Interface Agent</h1>
                <p className="text-blue-100">Bienvenue, {profile.full_name}</p>
                <p className="text-blue-200 text-sm">Pays: {profile.country}</p>
              </div>
            </div>
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

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Solde Agent */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-6 h-6" />
                <h3 className="font-medium text-blue-100">Solde Agent</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalance(!showBalance)}
                className="text-white/80 hover:text-white hover:bg-white/20 p-2"
              >
                {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <div className="text-3xl font-bold mb-2">{displayBalance}</div>
            <p className="text-blue-100 text-sm">Votre solde disponible</p>
          </CardContent>
        </Card>

        {/* Actions Agent */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-blue-200 shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/agent-services')}>
            <CardContent className="p-6 text-center">
              <ArrowRight className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-blue-700 mb-2">Services Clients</h3>
              <p className="text-sm text-gray-600">Transferts et opérations clients</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/commission')}>
            <CardContent className="p-6 text-center">
              <Receipt className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-green-700 mb-2">Commissions</h3>
              <p className="text-sm text-gray-600">Gestion des commissions</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/agent-reports')}>
            <CardContent className="p-6 text-center">
              <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-purple-700 mb-2">Rapports</h3>
              <p className="text-sm text-gray-600">Statistiques et rapports</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/deposit-withdrawal')}>
            <CardContent className="p-6 text-center">
              <PlusCircle className="w-8 h-8 text-orange-600 mx-auto mb-3" />
              <h3 className="font-semibold text-orange-700 mb-2">Dépôt/Retrait</h3>
              <p className="text-sm text-gray-600">Services de dépôt et retrait</p>
            </CardContent>
          </Card>

          <Card className="border-red-200 shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/agent-withdrawal-simple')}>
            <CardContent className="p-6 text-center">
              <MinusCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
              <h3 className="font-semibold text-red-700 mb-2">Retrait Simple</h3>
              <p className="text-sm text-gray-600">Retraits rapides</p>
            </CardContent>
          </Card>

          <Card className="border-indigo-200 shadow-lg hover:shadow-xl transition-shadow cursor-pointer" onClick={() => navigate('/agent-withdrawal-advanced')}>
            <CardContent className="p-6 text-center">
              <Wallet className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
              <h3 className="font-semibold text-indigo-700 mb-2">Retrait Avancé</h3>
              <p className="text-sm text-gray-600">Retraits avec vérification</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewAgentDashboard;
