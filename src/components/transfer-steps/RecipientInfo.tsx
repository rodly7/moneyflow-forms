import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TransferData } from "../TransferForm";

type RecipientInfoProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const RecipientInfo = ({ recipient, updateFields }: RecipientInfoProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="recipientName">Full Name</Label>
        <Input
          id="recipientName"
          type="text"
          required
          placeholder="Recipient's full name"
          value={recipient.fullName}
          onChange={(e) =>
            updateFields({
              recipient: { ...recipient, fullName: e.target.value },
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recipientAddress">Address</Label>
        <Input
          id="recipientAddress"
          type="text"
          required
          placeholder="Recipient's address"
          value={recipient.address}
          onChange={(e) =>
            updateFields({
              recipient: { ...recipient, address: e.target.value },
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recipientPhone">Phone Number</Label>
        <Input
          id="recipientPhone"
          type="tel"
          required
          placeholder="+1234567890"
          value={recipient.phone}
          onChange={(e) =>
            updateFields({ recipient: { ...recipient, phone: e.target.value } })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bankName">Bank Name</Label>
        <Input
          id="bankName"
          type="text"
          required
          placeholder="Recipient's bank name"
          value={recipient.bankName}
          onChange={(e) =>
            updateFields({
              recipient: { ...recipient, bankName: e.target.value },
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="accountNumber">Account Number / IBAN</Label>
        <Input
          id="accountNumber"
          type="text"
          required
          placeholder="Account number or IBAN"
          value={recipient.accountNumber}
          onChange={(e) =>
            updateFields({
              recipient: { ...recipient, accountNumber: e.target.value },
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="swiftCode">SWIFT/BIC Code</Label>
        <Input
          id="swiftCode"
          type="text"
          required
          placeholder="Bank SWIFT or BIC code"
          value={recipient.swiftCode}
          onChange={(e) =>
            updateFields({
              recipient: { ...recipient, swiftCode: e.target.value },
            })
          }
        />
      </div>
    </div>
  );
};

export default RecipientInfo;