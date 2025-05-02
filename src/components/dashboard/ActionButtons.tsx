import { ArrowRight, ArrowUpRight, UserMinus, Banknote, CreditCard, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface ActionButtonsProps {
  onTransferClick: () => void;
}

const ActionButtons = ({ onTransferClick }: ActionButtonsProps) => {
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
      
      <Link to="/agent" className="w-full">
        <Button variant="outline" className="flex flex-col items-center justify-center h-20 bg-white w-full">
          <Wallet className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Agent</span>
        </Button>
      </Link>
    </div>
  );
};

export default ActionButtons;
