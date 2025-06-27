
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (userData: { userId: string; fullName: string; phone: string }) => void;
}

const QRScanner = ({ isOpen, onClose, onScanSuccess }: QRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Attendre que le DOM soit prêt avant d'initialiser le scanner
      const timer = setTimeout(() => {
        initializeScanner();
      }, 100);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
          scannerRef.current = null;
        }
      };
    }
  }, [isOpen]);

  const initializeScanner = () => {
    try {
      // Vérifier que l'élément existe avant d'initialiser
      const element = document.getElementById("qr-scanner-container");
      if (!element) {
        console.error("Élément qr-scanner-container non trouvé");
        toast({
          title: "Erreur scanner",
          description: "Interface du scanner non disponible",
          variant: "destructive"
        });
        return;
      }

      const scanner = new Html5QrcodeScanner(
        "qr-scanner-container",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          supportedScanTypes: [],
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
        },
        false
      );

      scanner.render(
        (decodedText: string) => {
          console.log("QR Code scanné:", decodedText);
          handleScanSuccess(decodedText);
        },
        (error: string) => {
          // Ignorer les erreurs de scan normales
          if (!error.includes("No QR code found") && !error.includes("QR code parse error")) {
            console.warn("Erreur de scan:", error);
          }
        }
      );

      scannerRef.current = scanner;
      setIsScanning(true);
      
      toast({
        title: "Scanner initialisé",
        description: "Pointez la caméra vers le QR code",
      });

    } catch (error) {
      console.error('Erreur initialisation scanner:', error);
      toast({
        title: "Erreur scanner",
        description: "Impossible d'accéder à la caméra. Vérifiez les permissions.",
        variant: "destructive"
      });
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    try {
      setScanResult(decodedText);
      
      // Parser les données du QR code
      const qrData = JSON.parse(decodedText);
      
      // Vérifier que les données nécessaires sont présentes
      if (qrData.userId && qrData.fullName && qrData.phone) {
        // Vérifier que c'est un QR code de retrait
        if (qrData.action === 'withdraw' || qrData.type === 'user_withdrawal') {
          onScanSuccess({
            userId: qrData.userId,
            fullName: qrData.fullName,
            phone: qrData.phone
          });
          
          toast({
            title: "QR Code scanné avec succès",
            description: `Client identifié: ${qrData.fullName}`,
          });
          
          // Fermer le scanner après succès
          setTimeout(() => {
            onClose();
          }, 1000);
        } else {
          toast({
            title: "QR Code invalide",
            description: "Ce QR code n'est pas valide pour un retrait",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "QR Code invalide",
          description: "Ce QR code ne contient pas les informations utilisateur nécessaires",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erreur parsing QR:", error);
      toast({
        title: "QR Code invalide",
        description: "Format de QR code non reconnu",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    setIsScanning(false);
    setScanResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Camera className="h-5 w-5 text-emerald-600" />
            Scanner le QR Code client
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative bg-gray-100 rounded-lg overflow-hidden min-h-[300px]">
            {isOpen && (
              <div id="qr-scanner-container" className="w-full h-full"></div>
            )}
            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Initialisation du scanner...</p>
                </div>
              </div>
            )}
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Positionnez le QR code du client dans le cadre
            </p>
            {scanResult && (
              <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700 flex items-center justify-center gap-1">
                <CheckCircle className="w-3 h-3" />
                QR Code détecté et traité
              </div>
            )}
            <p className="text-xs text-gray-500">
              Assurez-vous d'autoriser l'accès à la caméra
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRScanner;
