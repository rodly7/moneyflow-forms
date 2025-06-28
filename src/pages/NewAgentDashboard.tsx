
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
  Receipt,
  Sparkles,
  TrendingUp
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-pink-100">
        <Card className="w-full max-w-md backdrop-blur-xl bg-white/80 shadow-2xl border border-white/50 rounded-3xl">
          <CardHeader className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-purple-600 text-xl">Chargement...</CardTitle>
            <CardDescription className="text-gray-600">Chargement de votre profil agent...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (profile.role !== 'agent') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-red-50 to-orange-100">
        <Card className="w-full max-w-md backdrop-blur-xl bg-white/80 shadow-2xl border border-white/50 rounded-3xl">
          <CardHeader className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-red-600 text-xl">Accès refusé</CardTitle>
            <CardDescription className="text-gray-600 mb-4">
              Cette page est réservée aux agents. Votre rôle: {profile.role}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full rounded-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100 relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Enhanced Header Agent */}
      <div className="relative z-10 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 backdrop-blur-xl shadow-2xl">
        <div className="max-w-6xl mx-auto p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-xl">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white drop-shadow-lg">Interface Agent</h1>
                <p className="text-blue-100 text-lg">Bienvenue, {profile.full_name}</p>
                <p className="text-blue-200 flex items-center gap-2 mt-1">
                  <TrendingUp className="w-4 h-4" />
                  Pays: {profile.country}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-white hover:bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20 hover:border-white/40 transition-all duration-300"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-8 space-y-8">
        {/* Enhanced Balance Card */}
        <Card className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white border-0 shadow-2xl backdrop-blur-xl rounded-3xl overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Wallet className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-purple-100 text-lg">Solde Agent</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBalance(!showBalance)}
                className="text-white/80 hover:text-white hover:bg-white/20 p-3 rounded-full transition-all duration-300"
              >
                {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </Button>
            </div>
            <div className="text-4xl font-bold mb-4 text-white drop-shadow-lg">{displayBalance}</div>
            <p className="text-purple-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Votre solde disponible
            </p>
          </CardContent>
        </Card>

        {/* Enhanced Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group backdrop-blur-xl bg-white/80 rounded-2xl overflow-hidden" onClick={() => navigate('/agent-services')}>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <ArrowRight className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-blue-700 mb-3 text-lg">Services Clients</h3>
              <p className="text-gray-600">Transferts et opérations clients</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group backdrop-blur-xl bg-white/80 rounded-2xl overflow-hidden" onClick={() => navigate('/commission')}>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Receipt className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-emerald-700 mb-3 text-lg">Commissions</h3>
              <p className="text-gray-600">Gestion des commissions</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group backdrop-blur-xl bg-white/80 rounded-2xl overflow-hidden" onClick={() => navigate('/agent-reports')}>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-purple-700 mb-3 text-lg">Rapports</h3>
              <p className="text-gray-600">Statistiques et rapports</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group backdrop-blur-xl bg-white/80 rounded-2xl overflow-hidden" onClick={() => navigate('/deposit-withdrawal')}>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <PlusCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-orange-700 mb-3 text-lg">Dépôt/Retrait</h3>
              <p className="text-gray-600">Services de dépôt et retrait</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group backdrop-blur-xl bg-white/80 rounded-2xl overflow-hidden" onClick={() => navigate('/agent-withdrawal-simple')}>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <MinusCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-red-700 mb-3 text-lg">Retrait Simple</h3>
              <p className="text-gray-600">Retraits rapides</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group backdrop-blur-xl bg-white/80 rounded-2xl overflow-hidden" onClick={() => navigate('/agent-withdrawal-advanced')}>
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-indigo-700 mb-3 text-lg">Retrait Avancé</h3>
              <p className="text-gray-600">Retraits avec vérification</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewAgentDashboard;
