
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
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 w-full">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackClick}
            className="hover:bg-white/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Transfert d'Argent
          </h1>
        </div>

        {/* Transfer Form Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Send className="w-5 h-5" />
              Nouveau Transfert
            </CardTitle>
          </CardHeader>
          <CardContent className="w-full">
            <TransferForm />
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 w-full">
          <CardContent className="p-4">
            <div className="space-y-2 text-sm text-blue-700">
              <p>• Les transferts sont traités instantanément</p>
              <p>• Des frais peuvent s'appliquer selon le montant</p>
              <p>• Vérifiez bien les informations du destinataire</p>
              <p>• Un SMS de confirmation sera envoyé</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Transfer;
