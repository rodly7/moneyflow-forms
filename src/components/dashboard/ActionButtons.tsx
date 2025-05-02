
import { ArrowRight, ArrowUpRight, UserMinus, Banknote, CreditCard, Wallet } from "lucide-react";
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
      <Button onClick={onTransferClick} variant="outline" className="flex flex-col items-center justify-center h-20 bg-white">
        <ArrowUpRight className="h-5 w-5 mb-1" />
        <span className="text-xs font-medium">Envoyer</span>
      </Button>
      
      <Link to="/receive" className="w-full">
        <Button variant="outline" className="flex flex-col items-center justify-center h-20 bg-white w-full">
          <ArrowRight className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Recharger</span>
        </Button>
      </Link>
      
      <Link to="/withdraw" className="w-full">
        <Button variant="outline" className="flex flex-col items-center justify-center h-20 bg-white w-full">
          <UserMinus className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Retirer</span>
        </Button>
      </Link>
      
      <Link to="/mobile-recharge" className="w-full">
        <Button variant="outline" className="flex flex-col items-center justify-center h-20 bg-white w-full">
          <Banknote className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Mobile</span>
        </Button>
      </Link>
      
      <Link to="/bill-payments" className="w-full">
        <Button variant="outline" className="flex flex-col items-center justify-center h-20 bg-white w-full">
          <CreditCard className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Paiements</span>
        </Button>
      </Link>
      
      {isAgent() && (
        <Link to="/agent" className="w-full">
          <Button variant="outline" className="flex flex-col items-center justify-center h-20 bg-white w-full border-emerald-200 bg-emerald-50">
            <Wallet className="h-5 w-5 mb-1 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-600">Agent</span>
          </Button>
        </Link>
      )}
      {!isAgent() && (
        <div className="flex flex-col items-center justify-center h-20 bg-gray-100 rounded-md w-full border border-gray-200">
          <Wallet className="h-5 w-5 mb-1 text-gray-400" />
          <span className="text-xs font-medium text-gray-400">Agent</span>
          <span className="text-[10px] text-gray-400">Accès limité</span>
        </div>
      )}
    </div>
  );
};

export default ActionButtons;
