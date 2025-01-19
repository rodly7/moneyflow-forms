import TransferForm from "@/components/TransferForm";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container">
        <h1 className="text-3xl font-bold text-center mb-8">
          International Money Transfer
        </h1>
        <TransferForm />
      </div>
    </div>
  );
};

export default Index;