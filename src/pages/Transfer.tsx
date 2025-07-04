
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TransferForm from "@/components/TransferForm";

const Transfer = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleBackClick = () => {
    if (profile?.role === 'agent') {
      navigate('/agent-dashboard');
    } else if (profile?.role === 'admin') {
      navigate('/main-admin');
    } else if (profile?.role === 'sub_admin') {
      navigate('/sub-admin');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background p-3">
      <div className="max-w-4xl mx-auto space-y-3">
        {/* Compact Header */}
        <div className="flex items-center gap-3 p-3 bg-card rounded-lg border">
          <Button variant="outline" size="sm" onClick={handleBackClick}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Send className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Transfert d'Argent</h1>
              <p className="text-xs text-muted-foreground">Envoyez de l'argent</p>
            </div>
          </div>
        </div>

        {/* Compact Form */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <TransferForm />
          </CardContent>
        </Card>

        {/* Compact Info */}
        <div className="bg-muted/30 p-3 rounded-lg">
          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              <span>Transferts instantanés</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              <span>SMS de confirmation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transfer;
