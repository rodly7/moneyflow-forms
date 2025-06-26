
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/integrations/supabase/client";

interface WithdrawalRequestNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onReject: () => void;
  requestData: {
    amount: number;
    agent_name: string;
    agent_phone: string;
    created_at: string;
  } | null;
}

const WithdrawalRequestNotification = ({
  isOpen,
  onClose,
  onConfirm,
  onReject,
  requestData
}: WithdrawalRequestNotificationProps) => {
  if (!requestData) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-orange-600">
            📱 Message de l'Application
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-4">
            <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
              <div className="text-lg font-bold text-orange-800 mb-2">
                Demande de Retrait
              </div>
              <div className="text-2xl font-bold text-orange-900">
                {formatCurrency(requestData.amount, 'XAF')}
              </div>
            </div>
            
            <div className="space-y-3 text-left bg-gray-50 p-4 rounded-lg">
              <div className="text-center mb-3">
                <p className="font-medium text-gray-800">
                  Un agent souhaite effectuer un retrait sur votre compte :
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Agent :</span> 
                  <span className="font-medium">{requestData.agent_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Téléphone :</span> 
                  <span className="font-medium">{requestData.agent_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date :</span> 
                  <span className="font-medium">{new Date(requestData.created_at).toLocaleString('fr-FR')}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <p className="text-blue-800 font-medium text-center">
                ⚠️ Confirmez-vous ce retrait ?
              </p>
              <p className="text-blue-600 text-sm text-center mt-1">
                Vérifiez que vous êtes bien en présence de cet agent avant de confirmer.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2">
          <AlertDialogCancel 
            onClick={onReject}
            className="flex-1 bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
          >
            ❌ Refuser
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            ✅ Confirmer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default WithdrawalRequestNotification;
