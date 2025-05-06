
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase, formatCurrency, getCurrencyForCountry, convertCurrency } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Receipt } from "lucide-react";

interface CommissionData {
  total_commission: number;
  transfer_commission: number;
  withdrawal_commission: number;
  currency: string;
}

const Commission = () => {
  const { user } = useAuth();
  const [currency, setCurrency] = useState("XAF");

  const { data: profile, isLoading: profileLoading } = useQuery({
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

  useEffect(() => {
    if (profile?.country) {
      setCurrency(getCurrencyForCountry(profile.country));
    }
  }, [profile]);

  const { data: commissionData, isLoading } = useQuery({
    queryKey: ['commission-data'],
    queryFn: async () => {
      // Get commission data for the agent
      const { data: transferCommissionsData, error: transferError } = await supabase
        .from('commissions')
        .select('amount')
        .eq('agent_id', user?.id)
        .eq('type', 'transfer');

      const { data: withdrawalCommissionsData, error: withdrawalError } = await supabase
        .from('commissions')
        .select('amount')
        .eq('agent_id', user?.id)
        .eq('type', 'withdrawal');

      if (transferError || withdrawalError) {
        throw transferError || withdrawalError;
      }

      const transferCommission = transferCommissionsData?.reduce((sum, item) => sum + item.amount, 0) || 0;
      const withdrawalCommission = withdrawalCommissionsData?.reduce((sum, item) => sum + item.amount, 0) || 0;
      
      return {
        total_commission: transferCommission + withdrawalCommission,
        transfer_commission: transferCommission,
        withdrawal_commission: withdrawalCommission,
        currency: "XAF" // Base currency
      };
    },
    enabled: !!user?.id,
  });

  if (isLoading || profileLoading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
    </div>;
  }

  const convertedCommission = commissionData ? {
    total_commission: convertCurrency(commissionData.total_commission, "XAF", currency),
    transfer_commission: convertCurrency(commissionData.transfer_commission, "XAF", currency),
    withdrawal_commission: convertCurrency(commissionData.withdrawal_commission, "XAF", currency),
    currency
  } : {
    total_commission: 0,
    transfer_commission: 0,
    withdrawal_commission: 0,
    currency
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-500/20 to-blue-500/20 py-8 px-4">
      <div className="container max-w-3xl mx-auto space-y-8">
        <Card className="bg-white shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold flex items-center">
              <Receipt className="mr-2 h-6 w-6 text-amber-600" />
              Commissions
            </CardTitle>
            {profile?.role === "agent" && (
              <div className="flex items-center bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm">
                <Star className="h-4 w-4 mr-1 text-amber-500 fill-amber-500" />
                Agent
              </div>
            )}
          </CardHeader>

          <CardContent className="pt-6">
            <div className="grid gap-6">
              <div className="flex flex-col items-center p-6 bg-amber-50 rounded-lg border border-amber-200">
                <h3 className="text-gray-500 text-sm font-medium mb-1">Commission Totale</h3>
                <p className="text-4xl font-bold text-amber-600">
                  {formatCurrency(convertedCommission.total_commission, convertedCommission.currency)}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-gray-500 text-sm font-medium mb-1">Transferts</h3>
                  <p className="text-2xl font-bold text-gray-700">
                    {formatCurrency(convertedCommission.transfer_commission, convertedCommission.currency)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Taux: 1,5% des frais</p>
                </div>

                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-gray-500 text-sm font-medium mb-1">Retraits</h3>
                  <p className="text-2xl font-bold text-gray-700">
                    {formatCurrency(convertedCommission.withdrawal_commission, convertedCommission.currency)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Taux: 0,5% des frais</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-medium mb-2">Résumé des commissions</h3>
                <ul className="text-sm space-y-1">
                  <li>• Sur les transferts internationaux: vous recevez 1,5% (l'entreprise reçoit 3,5%)</li>
                  <li>• Sur les retraits: vous recevez 0,5% (l'entreprise reçoit 1,5%)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Commission;
