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
      <DialogContent className="max-w-md w-full mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center">Scanner QR Code</DialogTitle>
        </DialogHeader>
        
        <div className="w-full flex flex-col items-center justify-center space-y-6">
          {!showManualInput && (
            <>
              <div className="w-80 h-80 bg-gray-100 rounded-lg relative flex items-center justify-center">
                {cameraStarted ? (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover rounded-lg"
                    playsInline
                    muted
                    autoPlay
                  />
                ) : (
                  <p className="text-gray-500">Démarrage caméra...</p>
                )}
              </div>

              <Button
                variant="outline"
                onClick={() => setShowManualInput(true)}
                className="px-8 py-2"
              >
                Saisie manuelle
              </Button>
            </>
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