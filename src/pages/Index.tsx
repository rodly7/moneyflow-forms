import TransferForm from "@/components/TransferForm";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-4 px-2">
      <div className="container max-w-3xl mx-auto">
        <div className="flex flex-col items-center mb-6 space-y-2">
          <img 
            src="/sendflow-logo.png" 
            alt="SendFlow Logo" 
            className="w-32 h-32 mb-2"
          />
          <h1 className="text-2xl md:text-3xl font-bold text-center text-emerald-600">
            Transfert d'Argent International
          </h1>
        </div>
        <TransferForm />
      </div>
    </div>
  );
};

export default Index;