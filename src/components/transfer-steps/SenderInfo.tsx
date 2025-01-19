import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransferData } from "../TransferForm";

type SenderInfoProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const SenderInfo = ({ sender, updateFields }: SenderInfoProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          type="text"
          required
          placeholder="As shown on ID"
          value={sender.fullName}
          onChange={(e) =>
            updateFields({ sender: { ...sender, fullName: e.target.value } })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          type="text"
          required
          placeholder="Your current address"
          value={sender.address}
          onChange={(e) =>
            updateFields({ sender: { ...sender, address: e.target.value } })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          required
          placeholder="+1234567890"
          value={sender.phone}
          onChange={(e) =>
            updateFields({ sender: { ...sender, phone: e.target.value } })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="idType">ID Type</Label>
        <Select
          value={sender.idType}
          onValueChange={(value) =>
            updateFields({ sender: { ...sender, idType: value } })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select ID type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="passport">Passport</SelectItem>
            <SelectItem value="nationalId">National ID</SelectItem>
            <SelectItem value="drivingLicense">Driving License</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="idNumber">ID Number</Label>
        <Input
          id="idNumber"
          type="text"
          required
          placeholder="Enter your ID number"
          value={sender.idNumber}
          onChange={(e) =>
            updateFields({ sender: { ...sender, idNumber: e.target.value } })
          }
        />
      </div>
    </div>
  );
};

export default SenderInfo;