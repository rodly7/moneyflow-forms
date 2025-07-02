
import ReceiptsList from "@/components/receipts/ReceiptsList";

const Receipts = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        <ReceiptsList />
      </div>
    </div>
  );
};

export default Receipts;
