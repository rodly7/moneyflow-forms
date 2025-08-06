
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Send, Sparkles } from "lucide-react";
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
    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-2 pb-8">
      <div className="max-w-2xl mx-auto space-y-3">
        {/* Stunning Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-1 rounded-xl shadow-lg">
          <div className="bg-white rounded-xl p-3">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleBackClick} 
                className="h-10 w-10 p-0 hover:scale-110 transition-transform"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Transfert d'Argent
                  </h1>
                  <p className="text-sm text-muted-foreground">Envoyez facilement</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Beautiful Form Card */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
          <Card className="relative bg-white border-0 shadow-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full">
                  <Send className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold">Nouveau Transfert</h2>
              </div>
              <TransferForm />
            </CardContent>
          </Card>
        </div>

        {/* Compact Info */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-l-green-500 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-700">✓ Transferts instantanés</span>
            <span className="text-blue-700">✓ SMS automatique</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transfer;
