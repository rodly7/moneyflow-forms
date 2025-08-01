import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { transactionLimitService } from "@/services/transactionLimitService";
import { AlertTriangle, TrendingUp } from "lucide-react";

export const MonthlyLimitCard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalSent: 0,
    remaining: 2000000,
    percentUsed: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      
      setIsLoading(true);
      const monthlyStats = await transactionLimitService.getMonthlyStats(user.id);
      setStats(monthlyStats);
      setIsLoading(false);
    };

    fetchStats();
  }, [user]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = () => {
    if (stats.percentUsed >= 90) return "text-red-600";
    if (stats.percentUsed >= 70) return "text-yellow-600";
    return "text-green-600";
  };

  const getProgressColor = () => {
    if (stats.percentUsed >= 90) return "bg-red-500";
    if (stats.percentUsed >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Limite Mensuelle
        </CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Utilisé</span>
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {stats.percentUsed.toFixed(1)}%
            </span>
          </div>
          
          <Progress 
            value={stats.percentUsed} 
            className="h-2"
            style={{
              background: `linear-gradient(to right, ${getProgressColor()} 0%, ${getProgressColor()} ${stats.percentUsed}%, hsl(var(--muted)) ${stats.percentUsed}%)`
            }}
          />
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Envoyé</p>
              <p className="font-medium">
                {stats.totalSent.toLocaleString()} XAF
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Restant</p>
              <p className="font-medium">
                {stats.remaining.toLocaleString()} XAF
              </p>
            </div>
          </div>

          {stats.percentUsed >= 90 && (
            <div className="flex items-center gap-2 p-2 bg-red-50 rounded-md">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-xs text-red-700">
                Limite presque atteinte
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};