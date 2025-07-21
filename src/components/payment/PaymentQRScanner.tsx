import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, X, CheckCircle, Type } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PaymentQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (userData: { userId: string; fullName: string; phone: string }) => void;
}

const PaymentQRScanner = ({ isOpen, onClose, onScanSuccess }: PaymentQRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualData, setManualData] = useState({
    userId: '',
    fullName: '',
    phone: ''
  });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setIsScanning(false);
      setCameraStarted(false);
      setScanResult(null);
      setShowManualInput(false);
      setManualData({ userId: '', fullName: '', phone: '' });
      
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
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    setCameraStarted(false);
  };

  const initializeCamera = async () => {
    try {
      // Demander l'accès à la caméra avec les contraintes natives
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Caméra arrière préférée
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        streamRef.current = stream;
        
        setCameraStarted(true);
        setIsScanning(true);
        
        toast({
          title: "Caméra démarrée",
          description: "Pointez vers le QR code ou utilisez la saisie manuelle",
        });
      }

    } catch (error) {
      console.error('Erreur initialisation caméra:', error);
      toast({
        title: "Erreur caméra",
        description: "Impossible d'accéder à la caméra. Utilisez la saisie manuelle.",
        variant: "destructive"
      });
      setShowManualInput(true);
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    // Configurer le canvas aux dimensions de la vidéo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Dessiner l'image de la vidéo sur le canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    toast({
      title: "Image capturée",
      description: "Utilisez la saisie manuelle pour entrer les données du destinataire",
    });
    
    setShowManualInput(true);
  };

  const handleManualSubmit = () => {
    if (!manualData.userId || !manualData.fullName || !manualData.phone) {
      toast({
        title: "Données incomplètes",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    onScanSuccess({
      userId: manualData.userId,
      fullName: manualData.fullName,
      phone: manualData.phone
    });
    
    toast({
      title: "Destinataire ajouté",
      description: `Destinataire: ${manualData.fullName}`,
    });
    
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleClose = () => {
    cleanupCamera();
    setScanResult(null);
    setShowManualInput(false);
    setManualData({ userId: '', fullName: '', phone: '' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center justify-center gap-2">
            <Camera className="h-5 w-5 text-blue-600" />
            Scanner le QR Code de paiement
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Caméra native */}
          {!showManualInput && (
            <>
              <div className="relative bg-gray-100 rounded-lg overflow-hidden min-h-[300px]">
                {cameraStarted && (
                  <>
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover rounded-lg"
                      playsInline
                      muted
                      autoPlay
                    />
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg"></div>
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
                    Initialisation de la caméra...
                  </p>
                )}
                
                <p className="text-xs text-gray-500">
                  Capturez l'image ou saisissez manuellement les données
                </p>
              </div>

              <div className="flex gap-2">
                {cameraStarted && (
                  <Button
                    onClick={captureFrame}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Capturer
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowManualInput(true)}
                  className="flex-1"
                >
                  <Type className="w-4 h-4 mr-2" />
                  Saisie manuelle
                </Button>
              </div>
            </>
          )}

          {/* Saisie manuelle */}
          {showManualInput && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-medium text-gray-800 mb-2">
                  Saisir les données du destinataire
                </h3>
                <p className="text-sm text-gray-600">
                  Entrez manuellement les informations du destinataire
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="fullName">Nom complet</Label>
                  <Input
                    id="fullName"
                    value={manualData.fullName}
                    onChange={(e) => setManualData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Nom du destinataire"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={manualData.phone}
                    onChange={(e) => setManualData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+221..."
                  />
                </div>
                <div>
                  <Label htmlFor="userId">ID Utilisateur</Label>
                  <Input
                    id="userId"
                    value={manualData.userId}
                    onChange={(e) => setManualData(prev => ({ ...prev, userId: e.target.value }))}
                    placeholder="ID du destinataire"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleManualSubmit}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowManualInput(false)}
                  className="flex-1"
                >
                  Retour caméra
                </Button>
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-600 text-center">
              🔒 Vérifiez toujours l'identité du destinataire avant le paiement
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full"
          >
            <X className="w-4 h-4 mr-2" />
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentQRScanner;