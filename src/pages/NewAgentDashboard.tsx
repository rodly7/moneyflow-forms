
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Wallet, 
  DollarSign,
  LogOut,
  Eye,
  EyeOff,
  BarChart3
} from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '@/integrations/supabase/client';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useToast } from '@/hooks/use-toast';

const NewAgentDashboard = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useDeviceDetection();
  const { toast } = useToast();
  const [showBalance, setShowBalance] = useState(true);

  console.log('🏢 NewAgentDashboard - Profil:', profile);

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
              {isMobile ? "" : "Déconnexion"}
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
        <Card className="border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-blue-700 flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Services Agent
            </CardTitle>
            <CardDescription className="text-blue-600">
              Gérez vos opérations d'agent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => navigate('/deposit-withdrawal')}
                className="h-20 flex-col space-y-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md"
              >
                <Wallet className="h-6 w-6" />
                <span className="text-sm font-medium">Dépôt & Retrait</span>
              </Button>

              <Button 
                onClick={() => navigate('/commission')}
                className="h-20 flex-col space-y-2 bg-green-600 hover:bg-green-700 text-white shadow-md"
              >
                <DollarSign className="h-6 w-6" />
                <span className="text-sm font-medium">Commissions</span>
              </Button>

              <Button 
                onClick={() => navigate('/agent-reports')}
                className="h-20 flex-col space-y-2 bg-purple-600 hover:bg-purple-700 text-white shadow-md"
              >
                <BarChart3 className="h-6 w-6" />
                <span className="text-sm font-medium">Rapports</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Informations Agent */}
        <Card className="border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-blue-700">Informations Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Nom:</span>
                <span className="font-medium">{profile.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Téléphone:</span>
                <span className="font-medium">{profile.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pays:</span>
                <span className="font-medium">{profile.country}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ville:</span>
                <span className="font-medium">{profile.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Statut:</span>
                <span className="font-medium text-green-600">Agent Actif</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewAgentDashboard;
