
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertTriangle, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/integrations/supabase/client";

interface WithdrawalRequest {
  id: string;
  amount: number;
  agent_name: string;
  agent_phone: string;
  created_at: string;
}

interface WithdrawalRequestNotificationProps {
  request: WithdrawalRequest;
  onConfirm: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onClose: () => void;
}

const WithdrawalRequestNotification = ({ 
  request, 
  onConfirm, 
  onReject, 
  onClose 
}: WithdrawalRequestNotificationProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm(request.id);
      toast({
        title: "Retrait autorisé",
        description: `Vous avez autorisé le retrait de ${formatCurrency(request.amount, 'XAF')}`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'autoriser le retrait",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await onReject(request.id);
      toast({
        title: "Retrait refusé",
        description: "Vous avez refusé cette demande de retrait",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de refuser le retrait",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md mx-auto border-orange-300 bg-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-orange-800 text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Demande de retrait
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white border border-orange-200 rounded-md p-4 space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-600" />
              <span className="font-medium">{request.agent_name}</span>
            </div>
            <div className="text-sm text-gray-600">
              Téléphone: {request.agent_phone}
            </div>
            <div className="text-2xl font-bold text-center text-orange-800">
              {formatCurrency(request.amount, 'XAF')}
            </div>
          </div>

          <div className="bg-orange-100 border border-orange-300 rounded-md p-3">
            <p className="text-orange-800 text-sm text-center">
              🔐 Un agent souhaite retirer de l'argent de votre compte. Autorisez-vous cette opération ?
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700 h-12"
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Autoriser
            </Button>

            <Button
              onClick={handleReject}
              disabled={isProcessing}
              variant="destructive"
              className="flex-1 h-12"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Refuser
            </Button>
          </div>

          <Button
            onClick={onClose}
            variant="outline"
            className="w-full"
            disabled={isProcessing}
          >
            Fermer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default WithdrawalRequestNotification;
