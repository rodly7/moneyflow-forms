
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, Eye, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/integrations/supabase/client";

const SubAdminDashboard = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-purple-600 font-medium">Chargement du profil...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profile.role !== 'sub_admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-red-600 mb-4">Accès refusé</h2>
              <p className="text-gray-600 mb-4">Cette interface est réservée aux sous-administrateurs.</p>
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Retour au tableau de bord
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 w-full">
      <div className="w-full mx-auto space-y-6 px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-purple-700">Sous-Administrateur</h1>
              <p className="text-purple-600">Bienvenue, {profile.full_name}</p>
            </div>
          </div>
          <Button onClick={handleSignOut} variant="ghost" className="text-red-600">
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>

        {/* Solde */}
        <Card className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6" />
              <div>
                <h2 className="text-lg font-bold">Solde</h2>
                <p className="text-2xl font-bold">{formatCurrency(profile.balance, 'XAF')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions disponibles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105 bg-white border-l-4 border-l-purple-500">
            <CardContent className="pt-4 pb-4 text-center">
              <Eye className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Voir les Utilisateurs</p>
              <p className="text-xs text-gray-600 mt-1">Consultation uniquement</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105 bg-white border-l-4 border-l-green-500">
            <CardContent className="pt-4 pb-4 text-center">
              <Users className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Dépôt Agent</p>
              <p className="text-xs text-gray-600 mt-1">Autorisation limitée</p>
            </CardContent>
          </Card>
        </div>

        {/* Informations sur les limitations */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800 text-lg">Limitations du Sous-Administrateur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-yellow-700 space-y-2">
              <p>• Vous pouvez uniquement <strong>consulter</strong> les informations des utilisateurs</p>
              <p>• Vous ne pouvez pas modifier, supprimer ou bannir des comptes</p>
              <p>• Vous ne pouvez pas changer les rôles des utilisateurs</p>
              <p>• Vous ne pouvez pas effectuer de recharges automatiques</p>
              <p>• Vous pouvez faire des dépôts vers les agents uniquement</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubAdminDashboard;
