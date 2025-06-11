
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { formatCurrency } from "@/integrations/supabase/client";

interface ClientData {
  id: string;
  full_name: string;
  phone: string;
  balance: number;
}

interface ClientSearchFormProps {
  phoneNumber: string;
  clientData: ClientData | null;
  isSearching: boolean;
  onPhoneChange: (value: string) => void;
  onSearch: () => void;
}

export const ClientSearchForm = ({ 
  phoneNumber, 
  clientData, 
  isSearching, 
  onPhoneChange, 
  onSearch 
}: ClientSearchFormProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="phone">Numéro du client</Label>
      <div className="flex gap-2">
        <Input
          id="phone"
          type="tel"
          placeholder="Entrez le numéro du client"
          value={phoneNumber}
          onChange={(e) => onPhoneChange(e.target.value)}
          required
          className="h-12"
        />
        <Button
          type="button"
          variant="outline"
          onClick={onSearch}
          disabled={isSearching || !phoneNumber}
          className="h-12 px-3"
        >
          {isSearching ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>
      
      {clientData && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-800 font-medium">
            ✓ Client: {clientData.full_name || 'Nom non disponible'}
          </p>
          <p className="text-green-700 text-sm">
            Solde: {formatCurrency(clientData.balance || 0, 'XAF')}
          </p>
        </div>
      )}
    </div>
  );
};
