
import { ArrowUpRight, Banknote, CreditCard, UserMinus, Receipt, PiggyBank, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWithdrawalConfirmations } from "@/hooks/useWithdrawalConfirmations";

type ActionButtonsProps = {
  onTransferClick: () => void;
};

const ActionButtons = ({ onTransferClick }: ActionButtonsProps) => {
  const { userRole } = useAuth();
  const { pendingWithdrawals, handleNotificationClick } = useWithdrawalConfirmations();
  
  const isAgent = () => userRole === 'agent';
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 py-2">
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
      
      {/* Withdrawal Confirmation - Only for regular users - Same row as factures */}
      {!isAgent() && (
        <Button 
          variant="outline" 
          className={`flex flex-col items-center justify-center h-20 bg-white ${
            pendingWithdrawals.length > 0 ? "border-orange-300 bg-orange-50" : ""
          }`}
          onClick={handleNotificationClick}
        >
          <div className="relative">
            <AlertTriangle className={`h-5 w-5 mb-1 ${
              pendingWithdrawals.length > 0 ? "text-orange-600" : "text-gray-600"
            }`} />
            {pendingWithdrawals.length > 0 && (
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-orange-500 rounded-full"></div>
            )}
          </div>
          <span className={`text-xs font-medium ${
            pendingWithdrawals.length > 0 ? "text-orange-700" : ""
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
  );
};

export default ActionButtons;
