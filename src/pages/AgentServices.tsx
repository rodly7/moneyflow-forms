
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, ArrowRight, RefreshCw, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AgentBalanceCard } from "@/components/agent/AgentBalanceCard";
import TransferForm from "@/components/TransferForm";
import { supabase } from "@/integrations/supabase/client";
import { useDeviceDetection } from "@/hooks/useDeviceDetection";

const AgentServices = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isMobile } = useDeviceDetection();
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
        console.error("❌ Erreur lors du chargement du solde agent:", error);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-red-600 mb-4">Accès refusé</h2>
              <p className="text-gray-600 mb-4">Cette page est réservée aux agents.</p>
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Retour au tableau de bord
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50/50 to-indigo-100/50 py-4 px-0 sm:py-8 sm:px-4">
      <div className="container max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => navigate('/agent-dashboard')} className="text-gray-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold text-blue-700">Services Agent</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchAgentBalance}
              disabled={isLoadingBalance}
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              {!isMobile && <span className="ml-1">Déconnexion</span>}
            </Button>
          </div>
        </div>

        {/* Solde Agent */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-blue-100 mb-2">Solde Agent</h3>
              <div className="text-3xl font-bold mb-2">
                {agentBalance.toLocaleString('fr-FR')} XAF
              </div>
              <p className="text-blue-100 text-sm">
                Pays: {profile.country}
              </p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="transfer" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transfer" className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4" />
              Transfert
            </TabsTrigger>
            <TabsTrigger value="deposit" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Dépôt/Retrait
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              📊 Rapports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transfer">
            <div className="space-y-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <h3 className="font-medium text-blue-800 mb-2">Mode Agent Activé</h3>
                  <p className="text-blue-600 text-sm">
                    Vous pouvez effectuer des transferts pour vos clients vers tous les pays disponibles.
                  </p>
                </CardContent>
              </Card>
              <TransferForm />
            </div>
          </TabsContent>

          <TabsContent value="deposit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Plus className="w-5 h-5" />
                  Services de Dépôt et Retrait
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 space-y-4">
                  <p className="text-gray-600 mb-4">
                    Gérez les dépôts et retraits de vos clients
                  </p>
                  <Button 
                    onClick={() => navigate('/deposit-withdrawal')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Accéder aux services de dépôt/retrait
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  📊 Rapports d'Activité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 space-y-4">
                  <p className="text-gray-600 mb-4">
                    Consultez vos rapports d'activité quotidiens, hebdomadaires et mensuels
                  </p>
                  <Button 
                    onClick={() => navigate('/agent-reports')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Voir mes rapports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AgentServices;
