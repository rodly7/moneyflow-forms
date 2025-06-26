
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
    <div className="w-full">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Actions rapides</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Transfer button - Seulement pour les utilisateurs normaux */}
          {!isAgent() && (
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-none h-28 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 col-span-2"
              onClick={onTransferClick}
            >
              <ArrowUpRight className="mb-2 h-8 w-8" />
              <span className="font-semibold text-base">Transfert</span>
            </Button>
          )}
          
          {/* Boutons pour les utilisateurs normaux */}
          {!isAgent() && (
            <>
              <Link to="/bill-payments" className="contents">
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center justify-center h-24 bg-white rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 border-blue-100 hover:border-blue-200"
                >
                  <Receipt className="h-6 w-6 mb-2 text-blue-600" />
                  <span className="text-xs font-medium text-blue-600">Factures</span>
                </Button>
              </Link>
              
              {/* Cloche de notification améliorée */}
              <div className="flex justify-center">
                <WithdrawalNotificationBell
                  notificationCount={pendingRequests.length}
                  onClick={handleNotificationClick}
                  className="h-24 w-full flex flex-col items-center justify-center bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 border-none"
                />
              </div>
            </>
          )}
          
          {/* Boutons pour les agents */}
          {isAgent() && (
            <>
              <Link to="/commission" className="contents">
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center justify-center h-24 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 border-none"
                >
                  <Receipt className="h-6 w-6 mb-2" />
                  <span className="text-xs font-medium">Commission</span>
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                className="flex flex-col items-center justify-center h-24 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 border-none"
                onClick={() => navigate('/agent-services')}
              >
                <PiggyBank className="h-6 w-6 mb-2" />
                <span className="text-xs font-medium">Services</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActionButtons;
