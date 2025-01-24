import TransferForm from "@/components/TransferForm";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const Index = () => {
  const { signOut, user } = useAuth();

  // Array of background colors for the avatar
  const bgColors = [
    'bg-purple-500', 'bg-blue-500', 'bg-green-500', 
    'bg-yellow-500', 'bg-red-500', 'bg-pink-500',
    'bg-indigo-500', 'bg-teal-500'
  ];

  // Get a random color from the array
  const randomColor = bgColors[Math.floor(Math.random() * bgColors.length)];

  // Get the first letter of the email
  const userInitial = user?.email?.[0].toUpperCase() || '?';

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
        <div className="flex items-center mb-6 space-x-4">
          <Avatar className={`w-32 h-32 ${randomColor}`}>
            <AvatarFallback className="text-4xl font-bold text-white">
              {userInitial}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-600">
            Transfert d'Argent International
          </h1>
        </div>
        <TransferForm />
      </div>
    </div>
  );
};

export default Index;