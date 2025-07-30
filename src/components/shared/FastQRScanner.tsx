import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface FastQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (userData: { userId: string; fullName: string; phone: string }) => void;
  title?: string;
  variant?: 'default' | 'payment';
  onMyCard?: () => void;
}

const FastQRScanner = ({ 
  isOpen, 
  onClose, 
  onScanSuccess, 
  title = "Scanner QR",
  variant = 'default',
  onMyCard 
}: FastQRScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);

  const startScanner = async () => {
    try {
      setError('');
      setIsScanning(true);

      const scanner = new Html5Qrcode("fast-qr-scanner");
      scannerRef.current = scanner;

      // Configuration ultra-simple pour performance maximale
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 5, // FPS très bas pour stabilité
          qrbox: 200, // Zone fixe simple
          aspectRatio: 1.0
        },
        (decodedText) => {
          // Arrêt immédiat pour éviter les scans multiples
          stopScanner();
          
          try {
            const userData = JSON.parse(decodedText);
            if (userData.userId && userData.fullName && userData.phone) {
              onScanSuccess(userData);
            } else {
              // Fallback pour données incomplètes
              onScanSuccess({
                userId: userData.userId || 'scan-' + Date.now(),
                fullName: userData.fullName || userData.name || 'Utilisateur',
                phone: userData.phone || decodedText
              });
            }
          } catch {
            // Traiter comme texte simple
            onScanSuccess({
              userId: 'scan-' + Date.now(),
              fullName: 'Utilisateur',
              phone: decodedText
            });
          }
          onClose();
        },
        () => {} // Pas de log d'erreur
      );
    } catch (err: any) {
      setError('Impossible d\'accéder à la caméra');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch {
        // Ignorer les erreurs
      }
    }
    setIsScanning(false);
  };

  const simulateQRScan = () => {
    onScanSuccess({
      userId: 'test-user-123',
      fullName: 'Utilisateur Test',
      phone: '+242065224790'
    });
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(startScanner, 100);
    }
    return () => {
      if (isOpen) stopScanner();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex flex-col">
      {/* Header minimaliste */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-[env(safe-area-inset-top)]">
        <div className="flex justify-between items-center">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white"
          >
            ✕
          </button>
          
          {variant === 'payment' && onMyCard && (
            <button
              onClick={onMyCard}
              className="px-4 py-2 bg-white/20 backdrop-blur rounded-full text-white text-sm"
            >
              Ma carte
            </button>
          )}
        </div>
      </div>

      {/* Zone de scan */}
      <div className="flex-1 relative">
        <div 
          id="fast-qr-scanner" 
          className="w-full h-full object-cover"
        />
        
        {/* Cadre de scan simple */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 border-4 border-white rounded-2xl relative">
            {/* Coins du cadre */}
            <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-white"></div>
            <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-white"></div>
            <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-white"></div>
            <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-white"></div>
            
            {/* Ligne de scan */}
            <div className="absolute inset-4 flex items-center">
              <div className="w-full h-0.5 bg-white animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Overlay sombre */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, transparent 25%, rgba(0,0,0,0.8) 50%)'
          }}
        />
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-[env(safe-area-inset-bottom)]">
        <div className="text-center mb-4">
          <h3 className="text-white text-lg font-medium mb-2">{title}</h3>
          <p className="text-white/80 text-sm">Positionnez le QR code dans le cadre</p>
        </div>
        
        <button
          onClick={simulateQRScan}
          className="w-full bg-white text-black py-3 rounded-xl font-medium"
        >
          Scanner un code test
        </button>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="absolute top-1/2 left-4 right-4 bg-red-500 text-white p-4 rounded-xl text-center">
          {error}
        </div>
      )}
    </div>
  );
};

export default FastQRScanner;