import TransferForm from "@/components/TransferForm";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const Index = () => {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-4 px-2">
      <div className="container max-w-3xl mx-auto">
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            onClick={signOut}
            className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </Button>
        </div>
        <div className="flex flex-col items-center mb-6 space-y-2">
          <img 
            src="sendFlow logo.jpeg" 
            alt=""
            className="w-32 h-32 mb-2 object-contain"
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