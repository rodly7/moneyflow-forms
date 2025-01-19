import TransferForm from "@/components/TransferForm";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
      <div className="container">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 text-primary">
          Transfert d'Argent International
        </h1>
        <TransferForm />
      </div>
    </div>
  );
};

export default Index;