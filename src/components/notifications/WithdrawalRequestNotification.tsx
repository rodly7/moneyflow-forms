
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
          <AlertDialogTitle className="text-center">
            Demande de Retrait
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-3">
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-lg font-bold text-orange-800">
                {formatCurrency(requestData.amount, 'XAF')}
              </div>
              <div className="text-sm text-orange-600 mt-1">
                Montant à retirer
              </div>
            </div>
            
            <div className="space-y-2 text-left">
              <div>
                <span className="font-medium">Agent:</span> {requestData.agent_name}
              </div>
              <div>
                <span className="font-medium">Téléphone:</span> {requestData.agent_phone}
              </div>
              <div>
                <span className="font-medium">Date:</span> {new Date(requestData.created_at).toLocaleString('fr-FR')}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mt-4">
              Voulez-vous autoriser ce retrait auprès de cet agent ?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2">
          <AlertDialogCancel 
            onClick={onReject}
            className="flex-1 bg-red-50 text-red-700 hover:bg-red-100"
          >
            Refuser
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            Autoriser
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default WithdrawalRequestNotification;
