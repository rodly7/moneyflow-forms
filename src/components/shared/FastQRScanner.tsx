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

      // Configuration optimisée pour détection rapide des données utilisateur
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10, // FPS optimisé pour rapidité
          qrbox: { width: 250, height: 250 }, // Zone optimisée
          aspectRatio: 1.0
        },
        (decodedText) => {
          console.log('QR détecté:', decodedText);
          
          // Arrêt immédiat pour éviter les scans multiples
          stopScanner();
          
          try {
            // Tentative de parsing JSON pour les QR codes utilisateur
            const userData = JSON.parse(decodedText);
            console.log('Données utilisateur parsées:', userData);
            
            // Vérification stricte des données utilisateur
            if (userData.userId && userData.fullName && userData.phone) {
              console.log('QR utilisateur valide détecté');
              onScanSuccess({
                userId: userData.userId,
                fullName: userData.fullName,
                phone: userData.phone
              });
            } else if (userData.id && userData.name && userData.phone) {
              // Format alternatif
              console.log('QR utilisateur format alternatif détecté');
              onScanSuccess({
                userId: userData.id,
                fullName: userData.name,
                phone: userData.phone
              });
            } else {
              // Données JSON incomplètes
              console.log('Données JSON incomplètes, utilisation de fallback');
              onScanSuccess({
                userId: userData.userId || userData.id || 'user-' + Date.now(),
                fullName: userData.fullName || userData.name || userData.fullName || 'Utilisateur',
                phone: userData.phone || userData.tel || userData.telephone || decodedText
              });
            }
          } catch (parseError) {
            console.log('Erreur parsing JSON, traitement comme texte simple:', parseError);
            
            // Si ce n'est pas du JSON, traiter comme numéro de téléphone
            const cleanedText = decodedText.replace(/[^+\d]/g, '');
            if (cleanedText.length >= 8) {
              onScanSuccess({
                userId: 'qr-user-' + Date.now(),
                fullName: 'Utilisateur QR',
                phone: cleanedText
              });
            } else {
              setError('QR code non reconnu comme données utilisateur');
              return;
            }
          }
          onClose();
        },
        (errorMessage) => {
          // Log silencieux des erreurs de scan
        }
      );
    } catch (err: any) {
      console.error('Erreur démarrage scanner:', err);
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

      {/* Zone de scan - Caméra plein écran */}
      <div className="flex-1 relative">
        <div 
          id="fast-qr-scanner" 
          className="w-full h-full object-cover"
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