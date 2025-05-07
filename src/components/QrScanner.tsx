
import { useState, useRef } from "react";
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { QrCode, X } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

// Ce composant est maintenant obsolète et ne sera plus utilisé dans la nouvelle version
// Il est conservé temporairement pour référence, mais devra être supprimé plus tard
const QrScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const { toast } = useToast();
  const qrRef = useRef(null);
  const navigate = useNavigate();

  const handleScanToggle = () => {
    setIsScanning((prev) => !prev);
    if (!isScanning) {
      setVerificationCode("");
    }
  };

  const handleVerificationCodeChange = (value: string) => {
    setVerificationCode(value);
  };

  const processCode = async () => {
    toast({
      title: "Fonctionnalité désactivée",
      description: "Le nouveau système de retrait est maintenant disponible. Utilisez-le à la place.",
      variant: "destructive"
    });
    navigate('/agent');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-4 px-0">
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/retrait-agent')}
            className="text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-semibold">Fonctionnalité obsolète</h2>
          <div className="w-9"></div>
        </div>
      
        <div className="space-y-6">
          <div className="card border rounded-lg shadow-md p-4 bg-white">
            <div className="text-center mb-6">
              <p className="text-sm text-gray-600 mb-2">
                Cette fonctionnalité a été remplacée par le nouveau système de retrait.
              </p>
              <p className="text-xs text-gray-500">
                Veuillez utiliser le nouveau système accessible depuis le tableau de bord.
              </p>
            </div>

            <Button
              variant="default"
              onClick={() => navigate('/agent')}
              className="w-full mb-4"
            >
              <X className="mr-2 h-4 w-4" />
              Retourner au tableau de bord
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QrScanner;
