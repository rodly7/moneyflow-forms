
import { ArrowUpRight, Banknote, CreditCard, UserMinus, Receipt, PiggyBank } from "lucide-react";
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
      {/* Transfer button */}
      <Button 
        variant="outline" 
        className="flex flex-col items-center justify-center h-20 bg-white"
        onClick={onTransferClick}
      >
        <ArrowUpRight className="h-5 w-5 mb-1" />
        <span className="text-xs font-medium">
          {isAgent() ? "Transfert International" : "Transfert"}
        </span>
      </Button>
      
      {/* Services Agent - Only for agents */}
      {isAgent() && (
        <Button 
          variant="outline" 
          className="flex flex-col items-center justify-center h-20 bg-white"
          onClick={() => window.location.href = '/deposit'}
        >
          <PiggyBank className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Services Agent</span>
        </Button>
      )}
      
      {/* Mobile recharge - Only for regular users */}
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
      
      {/* Withdraw - Only for regular users (removed for agents) */}
      {!isAgent() && (
        <Button 
          variant="outline" 
          className="flex flex-col items-center justify-center h-20 bg-white"
          onClick={() => window.location.href = '/withdraw'}
        >
          <UserMinus className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Retrait</span>
        </Button>
      )}
      
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
    </div>
  );
};

export default ActionButtons;
