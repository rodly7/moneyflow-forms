
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQRWithdrawal } from "@/hooks/useQRWithdrawal";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const QRCode = () => {
  const [code, setCode] = useState("");
  const { processQRWithdrawal, isProcessing } = useQRWithdrawal();
  const { toast } = useToast();

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast({
        title: "Code incomplet",
        description: "Veuillez entrer le code à 6 chiffres complet",
        variant: "destructive"
      });
      return;
    }

    // This is a simplified implementation - in a real app, you'd scan QR code for user data
    toast({
      title: "Fonctionnalité en développement",
      description: "La confirmation de retrait par QR code sera bientôt disponible",
    });
    setCode("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-8 px-4">
      <div className="container max-w-lg mx-auto">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>
        
        <Card>
          <CardHeader>
            <CardTitle>Confirmer un retrait</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600">
                Entrez le code à 6 chiffres fourni par la personne qui demande le retrait
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="verification-code">Code de vérification</Label>
              <InputOTP 
                maxLength={6} 
                value={code} 
                onChange={setCode}
                render={({ slots }) => (
                  <InputOTPGroup>
                    {slots.map((slot, i) => (
                      <InputOTPSlot key={i} {...slot} index={i} />
                    ))}
                  </InputOTPGroup>
                )}
              />
            </div>
            
            <Button 
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleVerify}
              disabled={isProcessing || code.length !== 6}
            >
              {isProcessing ? "Vérification..." : "Confirmer le retrait"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QRCode;
