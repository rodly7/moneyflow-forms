
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateUserBalance } from "@/services/adminBalanceService";
import { formatCurrency } from "@/integrations/supabase/client";

const AdminBalanceUpdate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleBalanceUpdate = async () => {
    const phone = "+221773637752";
    const amount = 15019999527525;

    setIsProcessing(true);
    
    try {
      const updateResult = await updateUserBalance(phone, amount);
      
      setResult(updateResult);
      
      toast({
        title: "Solde mis à jour avec succès",
        description: `Le compte de ${updateResult.user.full_name} a été crédité de ${formatCurrency(amount, 'XAF')}`,
      });
      
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la mise à jour du solde",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500/20 to-blue-500/20 p-4">
      <div className="container max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        <Card className="shadow-lg">
          <CardHeader className="py-4 px-4">
            <CardTitle className="text-lg font-semibold">Mise à jour du solde - Administration</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="font-medium text-blue-900 mb-2">Détails de l'opération</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><strong>Compte:</strong> NGANGOUE Charles Rodly</p>
                  <p><strong>Téléphone:</strong> +221773637752</p>
                  <p><strong>Montant à créditer:</strong> {formatCurrency(15019999527525, 'XAF')}</p>
                </div>
              </div>

              {!result && (
                <Button 
                  onClick={handleBalanceUpdate}
                  disabled={isProcessing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {isProcessing ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      <span>Traitement en cours...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <CheckCircle className="mr-2 h-5 w-5" />
                      <span>Confirmer la mise à jour du solde</span>
                    </div>
                  )}
                </Button>
              )}

              {result && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <h3 className="font-medium text-green-900">Opération réussie</h3>
                  </div>
                  <div className="space-y-1 text-sm text-green-800">
                    <p><strong>Utilisateur:</strong> {result.user.full_name}</p>
                    <p><strong>Ancien solde:</strong> {formatCurrency(result.oldBalance, 'XAF')}</p>
                    <p><strong>Montant crédité:</strong> {formatCurrency(result.amount, 'XAF')}</p>
                    <p><strong>Nouveau solde:</strong> {formatCurrency(result.newBalance, 'XAF')}</p>
                  </div>
                </div>
              )}

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center mb-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                  <h3 className="font-medium text-yellow-900">Attention</h3>
                </div>
                <p className="text-sm text-yellow-800">
                  Cette opération est irréversible. Assurez-vous que les informations sont correctes avant de confirmer.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminBalanceUpdate;
