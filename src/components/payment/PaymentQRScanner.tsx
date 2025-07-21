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
        
        <div className="min-h-[400px] flex flex-col justify-center items-center">
          {!showManualInput && (
            <div className="flex flex-col items-center gap-4">
              <div style={{ width: '300px', height: '300px' }} className="bg-gray-100 rounded-lg relative overflow-hidden mx-auto">
                {cameraStarted ? (
                  <video
                    ref={videoRef}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    className="rounded-lg"
                    playsInline
                    muted
                    autoPlay
                  />
                ) : (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                    <p>Démarrage caméra...</p>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setShowManualInput(true)}
                style={{ padding: '8px 24px', border: '1px solid #ccc', borderRadius: '6px', background: 'white' }}
              >
                Saisie manuelle
              </button>
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