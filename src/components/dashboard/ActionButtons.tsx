
import { ArrowUpRight, Banknote, CreditCard, UserMinus, Receipt, PiggyBank, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWithdrawalRequestNotifications } from "@/hooks/useWithdrawalRequestNotifications";
import WithdrawalNotificationBell from "@/components/notifications/WithdrawalNotificationBell";

type ActionButtonsProps = {
  onTransferClick: () => void;
};

const ActionButtons = ({ onTransferClick }: ActionButtonsProps) => {
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const { pendingRequests, handleNotificationClick } = useWithdrawalRequestNotifications();
  
  const isAgent = () => userRole === 'agent';
  
  return (
    <div className="w-full px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
        {/* Transfer button - Seulement pour les utilisateurs normaux */}
        {!isAgent() && (
          <Button 
            variant="outline" 
            className="flex flex-col items-center justify-center bg-white h-24 col-span-2"
            onClick={onTransferClick}
          >
            <ArrowUpRight className="mb-1 h-6 w-6" />
            <span className="font-medium text-sm">Transfert</span>
          </Button>
        )}
        
        {/* Ligne de boutons alignés pour les utilisateurs normaux */}
        {!isAgent() && (
          <>
            <Link to="/bill-payments" className="contents">
              <Button 
                variant="outline" 
                className="flex flex-col items-center justify-center h-20 bg-white"
              >
                <Receipt className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Factures</span>
              </Button>
            </Link>
            
            {/* Cloche de notification pour les retraits */}
            <div className="flex justify-center">
              <WithdrawalNotificationBell
                notificationCount={pendingRequests.length}
                onClick={handleNotificationClick}
                className="h-20 w-full flex flex-col items-center justify-center bg-white border border-gray-200 rounded-md hover:bg-gray-50"
              />
            </div>
          </>
        )}
        
        {/* Commission ou Services Agent selon le rôle */}
        {isAgent() && (
          <>
            <Link to="/commission" className="contents">
              <Button 
                variant="outline" 
                className="flex flex-col items-center justify-center h-20 bg-white border-blue-200 hover:bg-blue-50"
              >
                <Receipt className="h-5 w-5 mb-1 text-blue-600" />
                <span className="text-xs font-medium text-blue-600">Commission</span>
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-20 bg-white border-blue-200 hover:bg-blue-50"
              onClick={() => navigate('/agent-services')}
            >
              <PiggyBank className="h-5 w-5 mb-1 text-blue-600" />
              <span className="text-xs font-medium text-blue-600">Dépôt/Retrait</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ActionButtons;
