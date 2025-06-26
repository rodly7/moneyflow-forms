
import { ArrowUpRight, Banknote, CreditCard, UserMinus, Receipt, PiggyBank, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWithdrawalRequestNotifications } from "@/hooks/useWithdrawalRequestNotifications";

type ActionButtonsProps = {
  onTransferClick: () => void;
};

const ActionButtons = ({ onTransferClick }: ActionButtonsProps) => {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const { pendingRequests, handleNotificationClick } = useWithdrawalRequestNotifications();
  
  const isAgent = () => userRole === 'agent';
  
  const handleTransferClick = () => {
    if (isAgent()) {
      // Pour les agents, rediriger vers les services agent avec transfert
      navigate('/agent-services');
    } else {
      // Pour les utilisateurs normaux, utiliser la fonction onTransferClick
      onTransferClick();
    }
  };
  
  return (
    <div className="w-full px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
        {/* Transfer button - Plus grand pour les utilisateurs normaux */}
        <Button 
          variant="outline" 
          className={`flex flex-col items-center justify-center bg-white ${
            !isAgent() ? "h-24 col-span-2" : "h-20"
          } ${isAgent() ? "border-blue-200 hover:bg-blue-50" : ""}`}
          onClick={handleTransferClick}
        >
          <ArrowUpRight className={`mb-1 ${!isAgent() ? "h-6 w-6" : "h-5 w-5"} ${
            isAgent() ? "text-blue-600" : ""
          }`} />
          <span className={`font-medium ${!isAgent() ? "text-sm" : "text-xs"} ${
            isAgent() ? "text-blue-600" : ""
          }`}>
            {isAgent() ? "Transfert Agent" : "Transfert"}
          </span>
        </Button>
        
        {/* Commission ou Factures selon le rôle */}
        {isAgent() ? (
          <Link to="/commission" className="contents">
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-20 bg-white border-blue-200 hover:bg-blue-50"
            >
              <Receipt className="h-5 w-5 mb-1 text-blue-600" />
              <span className="text-xs font-medium text-blue-600">Commission</span>
            </Button>
          </Link>
        ) : (
          <Link to="/bill-payments" className="contents">
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-20 bg-white"
            >
              <Receipt className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Factures</span>
            </Button>
          </Link>
        )}
        
        {/* Confirmation de retrait - Seulement pour les utilisateurs normaux */}
        {!isAgent() && (
          <Button 
            variant="outline" 
            className={`flex flex-col items-center justify-center h-20 bg-white ${
              pendingRequests && pendingRequests.length > 0 ? "border-blue-300 bg-blue-50" : ""
            }`}
            onClick={() => {
              if (pendingRequests && pendingRequests.length > 0) {
                handleNotificationClick();
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
        
        {/* Services Agent - Seulement pour les agents */}
        {isAgent() && (
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center h-24 bg-white col-span-2 border-blue-200 hover:bg-blue-50"
            onClick={() => navigate('/agent-services')}
          >
            <PiggyBank className="h-6 w-6 mb-2 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Services Complets</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default ActionButtons;
