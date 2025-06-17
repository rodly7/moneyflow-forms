
import { ArrowUpRight, Banknote, CreditCard, UserMinus, Receipt, PiggyBank, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWithdrawalRequestNotifications } from "@/hooks/useWithdrawalRequestNotifications";

type ActionButtonsProps = {
  onTransferClick: () => void;
};

const ActionButtons = ({ onTransferClick }: ActionButtonsProps) => {
  const { userRole } = useAuth();
  const { pendingRequests, handleNotificationClick } = useWithdrawalRequestNotifications();
  
  const isAgent = () => userRole === 'agent';
  
  console.log("ActionButtons - pendingRequests:", pendingRequests?.length || 0);
  
  return (
    <div className="w-full px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
        {/* Transfer button - Made larger for regular users */}
        <Button 
          variant="outline" 
          className={`flex flex-col items-center justify-center bg-white ${
            !isAgent() ? "h-24 col-span-2" : "h-20"
          }`}
          onClick={onTransferClick}
        >
          <ArrowUpRight className={`mb-1 ${!isAgent() ? "h-6 w-6" : "h-5 w-5"}`} />
          <span className={`font-medium ${!isAgent() ? "text-sm" : "text-xs"}`}>
            Transfert
          </span>
        </Button>
        
        {/* Bill Payments - For all users */}
        <Link to="/bill-payments" className="contents">
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center h-20 bg-white"
          >
            <Receipt className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Factures</span>
          </Button>
        </Link>
        
        {/* Withdrawal Request Confirmation - Only for regular users - Same row as factures */}
        {!isAgent() && (
          <Button 
            variant="outline" 
            className={`flex flex-col items-center justify-center h-20 bg-white ${
              pendingRequests && pendingRequests.length > 0 ? "border-blue-300 bg-blue-50" : ""
            }`}
            onClick={() => {
              console.log("Bouton Confirmer retrait cliqué, pendingRequests:", pendingRequests?.length || 0);
              if (pendingRequests && pendingRequests.length > 0) {
                handleNotificationClick();
              } else {
                console.log("Aucune demande de retrait en attente");
              }
            }}
          >
            <div className="relative">
              <AlertTriangle className={`h-5 w-5 mb-1 ${
                pendingRequests && pendingRequests.length > 0 ? "text-blue-600" : "text-gray-600"
              }`} />
              {pendingRequests && pendingRequests.length > 0 && (
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full animate-pulse"></div>
              )}
            </div>
            <span className={`text-xs font-medium ${
              pendingRequests && pendingRequests.length > 0 ? "text-blue-700" : ""
            }`}>
              Confirmer retrait
            </span>
          </Button>
        )}
        
        {/* Services Agent - Only for agents - Made larger and redirect to unified system */}
        {isAgent() && (
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center h-24 bg-white col-span-2"
            onClick={() => window.location.href = '/agent-services'}
          >
            <PiggyBank className="h-6 w-6 mb-2" />
            <span className="text-sm font-medium">Services Agent</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default ActionButtons;
