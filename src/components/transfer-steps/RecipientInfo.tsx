
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransferData } from "@/types/transfer";
import { countries } from "@/data/countries";
import { useAuth } from "@/contexts/AuthContext";

type RecipientInfoProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const RecipientInfo = ({ recipient, updateFields }: RecipientInfoProps) => {
  const { userRole, profile } = useAuth();
  const userCountry = profile?.country || "Cameroun";
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="fullName">Nom Complet du Bénéficiaire</Label>
        <Input
          id="fullName"
          required
          placeholder="Entrez le nom complet"
          value={recipient.fullName}
          onChange={(e) =>
            updateFields({
              recipient: { ...recipient, fullName: e.target.value },
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email du Bénéficiaire</Label>
        <Input
          id="email"
          type="email"
          required
          placeholder="example@email.com"
          value={recipient.email}
          onChange={(e) =>
            updateFields({
              recipient: { ...recipient, email: e.target.value },
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Téléphone du Bénéficiaire (Optionnel)</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+237xxxxxxxx"
          value={recipient.phone || ""}
          onChange={(e) =>
            updateFields({
              recipient: { ...recipient, phone: e.target.value },
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="country">Pays de Destination</Label>
        <Select
          value={recipient.country}
          onValueChange={(value) =>
            updateFields({
              recipient: { ...recipient, country: value },
            })
          }
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez le pays" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.name} value={country.name}>
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {userRole === 'agent' && (
          <div className="text-xs space-y-1">
            <p className="text-blue-600">
              🏢 Mode Agent: Tous les pays disponibles
            </p>
            <p className="text-gray-500">
              Pays d'origine: {userCountry}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipientInfo;
