
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertCircle } from "lucide-react";

const Withdraw = () => {
  const { isAgent } = useAuth();
  const navigate = useNavigate();

  // Rediriger les agents vers la page de dépôt/retrait
  if (isAgent()) {
    navigate('/deposit');
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-4 px-0 sm:py-8 sm:px-4">
      <div className="container max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-gray-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Retrait</h1>
          <div className="w-10"></div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Service non disponible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Les retraits pour les utilisateurs ne sont plus disponibles directement.
              </p>
              <p className="text-gray-600">
                Veuillez vous rendre chez un agent MoneyFlow pour effectuer vos retraits.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4">
                <p className="text-blue-800 text-sm">
                  💡 Les agents MoneyFlow peuvent vous aider avec vos retraits en toute sécurité.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Withdraw;
