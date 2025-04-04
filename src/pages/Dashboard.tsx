
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase, formatCurrency, getCurrencyForCountry } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CreditCard, Wallet } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();

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

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
    </div>;
  }

  const userCurrency = profile?.country ? getCurrencyForCountry(profile.country) : "XAF";

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-8 px-4">
      <div className="container max-w-3xl mx-auto space-y-8">
        <Card className="bg-gradient-to-r from-emerald-500 to-emerald-700 text-white overflow-hidden">
          <CardContent className="p-8">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-80">Solde disponible</p>
                <h1 className="text-4xl font-bold mt-1 truncate">
                  {formatCurrency(profile?.balance || 0, userCurrency)}
                </h1>
                <p className="text-sm mt-2 opacity-80">
                  {profile?.full_name} • {profile?.country || "Non spécifié"}
                </p>
              </div>
              <CreditCard className="w-12 h-12 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/receive">
            <Button
              variant="outline"
              className="w-full h-24 text-lg border-2"
            >
              <Wallet className="w-6 h-6 mr-2" />
              Recevoir de l'argent
            </Button>
          </Link>
          <Link to="/withdraw">
            <Button
              variant="outline"
              className="w-full h-24 text-lg border-2"
            >
              <CreditCard className="w-6 h-6 mr-2" />
              Retirer de l'argent
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
