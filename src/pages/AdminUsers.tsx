
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, CreditCard, Wallet, Send } from "lucide-react";
import UsersDataTable from "@/components/admin/UsersDataTable";
import BatchAgentRecharge from "@/components/admin/BatchAgentRecharge";
import BatchAgentDeposit from "@/components/admin/BatchAgentDeposit";
import AdminSelfRecharge from "@/components/admin/AdminSelfRecharge";
import NotificationSender from "@/components/admin/NotificationSender";

const AdminUsers = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
  }, [profile, navigate]);

  const handleQuickRoleChange = async (userId: string, newRole: 'user' | 'agent' | 'admin' | 'sub_admin') => {
    try {
      // Implementation for role change would go here
      toast({
        title: "Rôle mis à jour",
        description: `Le rôle a été changé vers ${newRole}`,
      });
    } catch (error) {
      console.error("Erreur lors du changement de rôle:", error);
      toast({
        title: "Erreur",
        description: "Impossible de changer le rôle",
        variant: "destructive"
      });
    }
  };

  if (!profile || profile.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/main-admin')}
              className="hover:bg-white/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Gestion Administrative
            </h1>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm shadow-lg rounded-xl h-14">
            <TabsTrigger value="users" className="flex items-center gap-2 h-10">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Utilisateurs</span>
            </TabsTrigger>
            <TabsTrigger value="batch-recharge" className="flex items-center gap-2 h-10">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Recharge Agents</span>
            </TabsTrigger>
            <TabsTrigger value="batch-deposit" className="flex items-center gap-2 h-10">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Dépôt Agents</span>
            </TabsTrigger>
            <TabsTrigger value="self-recharge" className="flex items-center gap-2 h-10">
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">Mon Solde</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 h-10">
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Gestion des Utilisateurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UsersDataTable onQuickRoleChange={handleQuickRoleChange} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="batch-recharge" className="space-y-6">
            <BatchAgentRecharge />
          </TabsContent>

          <TabsContent value="batch-deposit" className="space-y-6">
            <BatchAgentDeposit onBack={() => setActiveTab("users")} />
          </TabsContent>

          <TabsContent value="self-recharge" className="space-y-6">
            <AdminSelfRecharge />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationSender />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminUsers;
