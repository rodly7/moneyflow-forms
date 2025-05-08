
import { ArrowUpRight, Banknote, CreditCard, UserMinus, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ActionButtonsProps {
  onTransferClick: () => void;
}

const ActionButtons = ({ onTransferClick }: ActionButtonsProps) => {
  const { isAgent } = useAuth();
  
  return (
    <div className="mx-4 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
      {/* Transfer - Show for agent only for international transfers */}
      <Button 
        onClick={onTransferClick} 
        variant="outline" 
        className="flex flex-col items-center justify-center h-20 bg-white"
      >
        <ArrowUpRight className="h-5 w-5 mb-1" />
        <span className="text-xs font-medium">
          {isAgent() ? "Transfert International" : "Transfert"}
        </span>
      </Button>
      
      {/* Mobile recharge - Only for regular users */}
      {!isAgent() && (
        <Link to="/mobile-recharge" className="w-full">
          <Button variant="outline" className="flex flex-col items-center justify-center h-20 bg-white w-full">
            <Banknote className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Mobile</span>
          </Button>
        </Link>
      )}
      
      {/* Withdraw - For all users */}
      <Link to="/withdraw" className="w-full">
        <Button variant="outline" className="flex flex-col items-center justify-center h-20 bg-white w-full">
          <UserMinus className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Retrait</span>
        </Button>
      </Link>
      
      {/* Payments - Only for regular users */}
      {!isAgent() && (
        <Link to="/bill-payments" className="w-full">
          <Button variant="outline" className="flex flex-col items-center justify-center h-20 bg-white w-full">
            <CreditCard className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Paiements</span>
          </Button>
        </Link>
      )}
      
      {/* Commission - For agents only */}
      {isAgent() && (
        <Link to="/commission" className="w-full">
          <Button variant="outline" className="flex flex-col items-center justify-center h-20 bg-white w-full border-amber-200 bg-amber-50">
            <Receipt className="h-5 w-5 mb-1 text-amber-600" />
            <span className="text-xs font-medium text-amber-600">Commission</span>
          </Button>
        </Link>
      )}
    </div>
  );
};

export default ActionButtons;
