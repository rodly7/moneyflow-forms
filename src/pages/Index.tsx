import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { User, CreditCard, Upload, Download, ArrowRightLeft, LogOut } from "lucide-react";
import TransferForm from "@/components/TransferForm";
import { useState } from "react";

const Index = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showTransfer, setShowTransfer] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-8 px-4">
      <div className="container max-w-3xl mx-auto space-y-8">
        {/* Profile Card */}
        <Card className="bg-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-100 p-3 rounded-full">
                  <User className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{profile?.full_name}</h2>
                  <p className="text-gray-500">{profile?.phone}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                className="text-gray-500 hover:text-gray-700"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 mr-2" />
                Déconnexion
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Balance Card */}
        <Card className="bg-gradient-to-r from-emerald-500 to-emerald-700 text-white">
          <CardContent className="p-8">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-80">Solde disponible</p>
                <h1 className="text-4xl font-bold mt-1">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'XAF'
                  }).format(profile?.balance || 0)}
                </h1>
              </div>
              <CreditCard className="w-12 h-12 opacity-80" />
            </div>
          </CardContent>
        </Card>

        {showTransfer ? (
          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={() => setShowTransfer(false)}
              className="mb-4"
            >
              ← Retour
            </Button>
            <TransferForm />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/receive">
              <Button
                variant="outline"
                className="w-full h-24 text-lg border-2"
              >
                <Upload className="w-6 h-6 mr-2" />
                Recharger votre compte
              </Button>
            </Link>
            <Link to="/withdraw">
              <Button
                variant="outline"
                className="w-full h-24 text-lg border-2"
              >
                <Download className="w-6 h-6 mr-2" />
                Retrait
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full h-24 text-lg border-2"
              onClick={() => setShowTransfer(true)}
            >
              <ArrowRightLeft className="w-6 h-6 mr-2" />
              Transfert
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;