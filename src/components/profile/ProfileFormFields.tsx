
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ProfileFormFieldsProps {
  fullName: string;
  setFullName: (value: string) => void;
  phone: string;
}

const ProfileFormFields = ({ 
  fullName, 
  setFullName, 
  phone 
}: ProfileFormFieldsProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="fullName">Nom complet *</Label>
        <Input 
          id="fullName"
          type="text" 
          value={fullName} 
          onChange={(e) => setFullName(e.target.value)} 
          placeholder="Votre nom complet"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Téléphone</Label>
        <Input 
          id="phone"
          type="text" 
          value={phone || ""} 
          disabled
          className="bg-gray-100"
        />
        <p className="text-xs text-gray-500">Le numéro de téléphone ne peut pas être modifié</p>
      </div>
    </>
  );
};

export default ProfileFormFields;
