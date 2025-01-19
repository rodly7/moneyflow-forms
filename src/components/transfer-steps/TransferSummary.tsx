import { Card } from "@/components/ui/card";
import { TransferData } from "../TransferForm";

type TransferSummaryProps = TransferData & {
  updateFields: (fields: Partial<TransferData>) => void;
};

const TransferSummary = ({
  sender,
  recipient,
  transfer,
}: TransferSummaryProps) => {
  const fees = transfer.amount * 0.01;
  const total = transfer.amount + fees;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Transfer Summary</h3>
        <p className="text-sm text-muted-foreground">
          Please review your transfer details
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="p-4 space-y-3">
          <h4 className="font-medium">Sender Information</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Name:</span>
            <span>{sender.fullName}</span>
            <span className="text-muted-foreground">Address:</span>
            <span>{sender.address}</span>
            <span className="text-muted-foreground">Phone:</span>
            <span>{sender.phone}</span>
            <span className="text-muted-foreground">ID Type:</span>
            <span>{sender.idType}</span>
            <span className="text-muted-foreground">ID Number:</span>
            <span>{sender.idNumber}</span>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <h4 className="font-medium">Recipient Information</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Name:</span>
            <span>{recipient.fullName}</span>
            <span className="text-muted-foreground">Address:</span>
            <span>{recipient.address}</span>
            <span className="text-muted-foreground">Phone:</span>
            <span>{recipient.phone}</span>
            <span className="text-muted-foreground">Bank:</span>
            <span>{recipient.bankName}</span>
            <span className="text-muted-foreground">Account:</span>
            <span>{recipient.accountNumber}</span>
            <span className="text-muted-foreground">SWIFT/BIC:</span>
            <span>{recipient.swiftCode}</span>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <h4 className="font-medium">Transfer Details</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Amount:</span>
            <span>
              {transfer.amount.toFixed(2)} {transfer.currency}
            </span>
            <span className="text-muted-foreground">Fees (1%):</span>
            <span>
              {fees.toFixed(2)} {transfer.currency}
            </span>
            <span className="text-muted-foreground">Total:</span>
            <span className="font-medium">
              {total.toFixed(2)} {transfer.currency}
            </span>
            <span className="text-muted-foreground">Reason:</span>
            <span>{transfer.reason}</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TransferSummary;