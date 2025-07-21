import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PaymentQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (userData: { userId: string; fullName: string; phone: string }) => void;
}

const PaymentQRScanner = ({ isOpen, onClose, onScanSuccess }: PaymentQRScannerProps) => {
  const [cameraStarted, setCameraStarted] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualData, setManualData] = useState({
    userId: '',
    fullName: '',
    phone: ''
  });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCameraStarted(false);
      setShowManualInput(false);
      setManualData({ userId: '', fullName: '', phone: '' });
      
      setTimeout(() => {
        initializeCamera();
      }, 100);

      return () => {
        cleanupCamera();
      };
    }
  }, [isOpen]);

  const cleanupCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraStarted(false);
  };

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraStarted(true);
      }
    } catch (error) {
      console.error('Erreur caméra:', error);
      setShowManualInput(true);
    }
  };

  const handleManualSubmit = () => {
    if (!manualData.userId || !manualData.fullName || !manualData.phone) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    onScanSuccess({
      userId: manualData.userId,
      fullName: manualData.fullName,
      phone: manualData.phone
    });
    
    onClose();
  };

  const handleClose = () => {
    cleanupCamera();
    setShowManualInput(false);
    setManualData({ userId: '', fullName: '', phone: '' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="text-center">
          <DialogTitle>Scanner QR Code</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex flex-col items-center">
          {!showManualInput && (
            <div className="w-full max-w-sm">
              <div className="bg-gray-100 rounded min-h-[300px] relative mx-auto">
                {cameraStarted ? (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover rounded"
                    playsInline
                    muted
                    autoPlay
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-center">Démarrage caméra...</p>
                  </div>
                )}
              </div>

              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowManualInput(true)}
                  className="w-full max-w-xs"
                >
                  Saisie manuelle
                </Button>
              </div>
            </div>
          )}

          {showManualInput && (
            <div className="space-y-4">
              <h3>Données du destinataire</h3>

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
                  className="flex-1"
                >
                  Confirmer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowManualInput(false)}
                  className="flex-1"
                >
                  Retour
                </Button>
              </div>
            </div>
          )}

          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full"
          >
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentQRScanner;