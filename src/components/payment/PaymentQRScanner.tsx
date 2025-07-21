import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, X, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QrScanner from 'qr-scanner';

interface PaymentQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (userData: { userId: string; fullName: string; phone: string }) => void;
}

const PaymentQRScanner = ({ isOpen, onClose, onScanSuccess }: PaymentQRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setIsScanning(false);
      setCameraStarted(false);
      setScanResult(null);
      
      const timer = setTimeout(() => {
        initializeCamera();
      }, 200);

      return () => {
        clearTimeout(timer);
        cleanupCamera();
      };
    }
  }, [isOpen]);

  const cleanupCamera = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
    setCameraStarted(false);
  };

  const initializeCamera = async () => {
    try {
      if (!videoRef.current) return;

      // Créer une nouvelle instance de QrScanner
      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => {
          console.log("QR Code détecté:", result.data);
          handleScanSuccess(result.data);
        },
        {
          preferredCamera: 'environment', // Caméra arrière préférée
          highlightScanRegion: true,
          highlightCodeOutline: true,
          returnDetailedScanResult: true,
        }
      );

      qrScannerRef.current = qrScanner;

      // Démarrer le scanner
      await qrScanner.start();
      
      setCameraStarted(true);
      setIsScanning(true);
      
      toast({
        title: "Scanner démarré",
        description: "Caméra activée - Pointez vers le QR code du destinataire",
      });

    } catch (error) {
      console.error('Erreur initialisation caméra:', error);
      toast({
        title: "Erreur caméra",
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
        onScanSuccess({
          userId: qrData.userId,
          fullName: qrData.fullName,
          phone: qrData.phone
        });
        
        toast({
          title: "QR Code scanné avec succès",
          description: `Destinataire identifié: ${qrData.fullName}`,
        });
        
        // Fermer le scanner après succès
        setTimeout(() => {
          onClose();
        }, 1500);
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
    cleanupCamera();
    setScanResult(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Camera className="h-5 w-5 text-blue-600" />
            Scanner le QR Code de paiement
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative bg-gray-100 rounded-lg overflow-hidden min-h-[300px]">
            {isOpen && (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover rounded-lg"
                  playsInline
                  muted
                  autoPlay
                />
                <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white rounded-lg border-dashed"></div>
                </div>
              </>
            )}
            {!cameraStarted && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90">
                <div className="text-center">
                  <Camera className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Démarrage de la caméra...</p>
                </div>
              </div>
            )}
          </div>

          <div className="text-center space-y-2">
            {cameraStarted ? (
              <p className="text-sm text-gray-600 font-medium">
                🎯 Pointez la caméra vers le QR code du destinataire
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                Initialisation du scanner...
              </p>
            )}
            
            {scanResult && (
              <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700 flex items-center justify-center gap-1">
                <CheckCircle className="w-3 h-3" />
                QR Code détecté et traité
              </div>
            )}
            
            <p className="text-xs text-gray-500">
              {cameraStarted ? "Le scan se fait automatiquement" : "Assurez-vous d'autoriser l'accès à la caméra"}
            </p>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-600 text-center">
              🔒 Assurez-vous que le QR code appartient bien à la personne à qui vous voulez envoyer de l'argent
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

export default PaymentQRScanner;