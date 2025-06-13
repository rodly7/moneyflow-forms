
import { ArrowUpRight, Banknote, CreditCard, UserMinus, Receipt, PiggyBank, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type ActionButtonsProps = {
  onTransferClick: () => void;
};

const ActionButtons = ({ onTransferClick }: ActionButtonsProps) => {
  const { userRole } = useAuth();
  
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
      
      {/* Recharge Balance button - Admin function */}
      <Link to="/admin-balance-update" className="contents">
        <Button 
          variant="outline" 
          className="flex flex-col items-center justify-center h-20 bg-white"
        >
          <Plus className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Recharger</span>
        </Button>
      </Link>
      
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
      
      {/* Mobile recharge - Only for regular users - Same row as factures */}
      {!isAgent() && (
        <Button 
          variant="outline" 
          className="flex flex-col items-center justify-center h-20 bg-white"
          onClick={() => window.location.href = '/mobile-recharge'}
        >
          <CreditCard className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Recharge</span>
        </Button>
      )}
      
      {/* Services Agent - Only for agents - Made larger */}
      {isAgent() && (
        <Button 
          variant="outline" 
          className="flex flex-col items-center justify-center h-24 bg-white col-span-2"
          onClick={() => window.location.href = '/deposit'}
        >
          <PiggyBank className="h-6 w-6 mb-2" />
          <span className="text-sm font-medium">Services Agent</span>
        </Button>
      )}
    </div>
  );
};

export default ActionButtons;
