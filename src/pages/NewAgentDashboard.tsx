
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, ArrowRight, RefreshCw, LogOut, Shield, TrendingUp, Wallet, Users, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const NewAgentDashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [agentBalance, setAgentBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const fetchAgentBalance = async () => {
    if (user?.id) {
      setIsLoadingBalance(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        setAgentBalance(data.balance || 0);
      } catch (error) {
        console.error("Erreur lors du chargement du solde agent:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger votre solde",
          variant: "destructive"
        });
      }
      setIsLoadingBalance(false);
    }
  };

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

  useEffect(() => {
    fetchAgentBalance();
  }, [user?.id]);

  if (!profile || profile.role !== 'agent') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Accès refusé</h2>
            <p className="text-gray-600 mb-6">Cette page est réservée aux agents autorisés.</p>
            <Button 
              onClick={() => navigate('/dashboard')} 
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              Retour au tableau de bord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 md:w-64 md:h-64 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 md:w-96 md:h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-4 md:py-8 max-w-6xl">
        {/* Enhanced Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 backdrop-blur-sm bg-white/70 rounded-2xl p-4 md:p-6 shadow-lg border border-white/20">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')} 
              className="text-gray-700 hover:bg-blue-50 border border-blue-200 hover:border-blue-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Retour</span>
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Tableau de Bord Agent
              </h1>
              <p className="text-sm text-gray-600 hidden sm:block">
                {profile.full_name} - {profile.country}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchAgentBalance}
              disabled={isLoadingBalance}
              className="hover:bg-green-50 border border-green-200"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-1">Actualiser</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Déconnexion</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-xl">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Solde Agent</p>
                  <p className="text-2xl md:text-3xl font-bold">{agentBalance.toLocaleString()} XAF</p>
                </div>
                <Wallet className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-emerald-600 to-green-600 text-white border-0 shadow-xl">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Pays</p>
                  <p className="text-lg md:text-xl font-bold">{profile.country}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-xl">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Clients Actifs</p>
                  <p className="text-2xl md:text-3xl font-bold">--</p>
                </div>
                <Users className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-600 to-red-600 text-white border-0 shadow-xl">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Transactions</p>
                  <p className="text-2xl md:text-3xl font-bold">--</p>
                </div>
                <Activity className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Service Transfert */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-blue-600">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <ArrowRight className="w-6 h-6 text-white" />
                </div>
                Services de Transfert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Effectuez des transferts pour vos clients vers tous les pays disponibles.
              </p>
              <Button 
                onClick={() => navigate('/agent-services')}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold h-12 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Accéder aux transferts
              </Button>
            </CardContent>
          </Card>

          {/* Service Dépôt/Retrait */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-emerald-600">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                Dépôt et Retrait
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Gérez les dépôts et retraits de vos clients en toute sécurité.
              </p>
              <Button 
                onClick={() => navigate('/deposit-withdrawal')}
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold h-12 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Accéder aux dépôts/retraits
              </Button>
            </CardContent>
          </Card>

          {/* Service Rapports */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-purple-600">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                Rapports & Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Consultez vos rapports d'activité et statistiques détaillées.
              </p>
              <Button 
                onClick={() => navigate('/agent-reports')}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold h-12 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Voir les rapports
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-gray-800">Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Button 
                  onClick={() => navigate('/agent-services')}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-20 border-2 border-blue-200 hover:bg-blue-50"
                >
                  <ArrowRight className="w-5 h-5 text-blue-600" />
                  <span className="text-xs">Transfert</span>
                </Button>
                
                <Button 
                  onClick={() => navigate('/deposit-withdrawal')}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-20 border-2 border-emerald-200 hover:bg-emerald-50"
                >
                  <Plus className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs">Dépôt</span>
                </Button>
                
                <Button 
                  onClick={() => navigate('/agent-reports')}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-20 border-2 border-purple-200 hover:bg-purple-50"
                >
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <span className="text-xs">Rapports</span>
                </Button>
                
                <Button 
                  onClick={fetchAgentBalance}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-20 border-2 border-orange-200 hover:bg-orange-50"
                  disabled={isLoadingBalance}
                >
                  <RefreshCw className={`w-5 h-5 text-orange-600 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                  <span className="text-xs">Actualiser</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewAgentDashboard;
