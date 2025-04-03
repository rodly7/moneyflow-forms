
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Download, ArrowRightLeft, Receipt, Phone, CreditCard } from "lucide-react";

interface ActionButtonsProps {
  onTransferClick: () => void;
}

const ActionButtons = ({ onTransferClick }: ActionButtonsProps) => {
  return (
    <>
      <div className="grid grid-cols-2 gap-2 mx-4">
        <Link to="/withdraw" className="col-span-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-14 text-xs border-2 flex flex-col gap-1"
          >
            <Download className="w-4 h-4" />
            Retrait
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          className="w-full h-14 text-xs border-2 flex flex-col gap-1 col-span-1"
          onClick={onTransferClick}
        >
          <ArrowRightLeft className="w-4 h-4" />
          Transfert
        </Button>
      </div>
      
      <div className="mx-4 mt-4">
        <h3 className="text-sm font-medium text-gray-600 mb-2">Services additionnels</h3>
        <div className="grid grid-cols-2 gap-2">
          <Link to="/bill-payments" className="col-span-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-14 text-xs border-2 flex flex-col gap-1"
            >
              <Receipt className="w-4 h-4 text-blue-500" />
              Factures
            </Button>
          </Link>
          <Link to="/mobile-recharge" className="col-span-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-14 text-xs border-2 flex flex-col gap-1"
            >
              <Phone className="w-4 h-4 text-green-500" />
              Recharges
            </Button>
          </Link>
          <Link to="/prepaid-cards" className="col-span-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-14 text-xs border-2 flex flex-col gap-1 bg-gradient-to-r from-blue-50 to-purple-50"
            >
              <CreditCard className="w-4 h-4 text-purple-500" />
              <span className="font-medium">Cartes prépayées</span>
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
};

export default ActionButtons;
