
import { ArrowUpRight, Banknote, CreditCard, Wallet, UserMinus, Receipt, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrencyForCountry } from "@/integrations/supabase/client";

interface ActionButtonsProps {
  onTransferClick: () => void;
}

const ActionButtons = ({ onTransferClick }: ActionButtonsProps) => {
  const { isAgent, user, userRole } = useAuth();
  
  return (
    <div className="mx-4 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
      {/* Transfer - Available for all users */}
      <Button onClick={onTransferClick} variant="outline" className="flex flex-col items-center justify-center h-20 bg-white">
        <ArrowUpRight className="h-5 w-5 mb-1" />
        <span className="text-xs font-medium">Transfert</span>
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
      
      {/* Withdraw - Only for regular users */}
      {!isAgent() && (
        <Link to="/withdraw" className="w-full">
          <Button variant="outline" className="flex flex-col items-center justify-center h-20 bg-white w-full">
            <UserMinus className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Retirer</span>
          </Button>
        </Link>
      )}
      
      {/* Payments - Only for regular users */}
      {!isAgent() && (
        <Link to="/bill-payments" className="w-full">
          <Button variant="outline" className="flex flex-col items-center justify-center h-20 bg-white w-full">
            <CreditCard className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Paiements</span>
          </Button>
        </Link>
      )}
      
      {/* Dépôt - For agents only */}
      {isAgent() && (
        <Link to="/agent-deposit" className="w-full">
          <Button variant="outline" className="flex flex-col items-center justify-center h-20 bg-white w-full">
            <Banknote className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Dépôt</span>
          </Button>
        </Link>
      )}
      
      {/* Replaced "Retrait Agent" with separate "Retrait" and "Commission" buttons */}
      {isAgent() && (
        <>
          <Link to="/retrait-agent" className="w-full">
            <Button variant="outline" className="flex flex-col items-center justify-center h-20 bg-white w-full border-emerald-200 bg-emerald-50">
              <Wallet className="h-5 w-5 mb-1 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-600">Retrait</span>
            </Button>
          </Link>
          
          <Link to="/commission" className="w-full">
            <Button variant="outline" className="flex flex-col items-center justify-center h-20 bg-white w-full border-amber-200 bg-amber-50">
              <Receipt className="h-5 w-5 mb-1 text-amber-600" />
              <span className="text-xs font-medium text-amber-600">Commission</span>
            </Button>
          </Link>
        </>
      )}
    </div>
  );
};

export default ActionButtons;
