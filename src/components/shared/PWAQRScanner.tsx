import { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';

interface PWAQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (userData: { userId: string; fullName: string; phone: string }) => void;
  title?: string;
}

const PWAQRScanner = ({ isOpen, onClose, onScanSuccess, title = "Scanner QR Code" }: PWAQRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError(null);
      console.log('🎥 Démarrage de la caméra PWA...');

      // Contraintes spécifiques pour PWA
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          aspectRatio: { ideal: 16/9 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play();
            setIsScanning(true);
            startQRDetection();
          }
        };
      }

      console.log('✅ Caméra démarrée avec succès');
    } catch (error) {
      console.error('❌ Erreur caméra:', error);
      setError('Impossible d\'accéder à la caméra. Veuillez autoriser l\'accès.');
    }
  };

  const stopCamera = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    setIsScanning(false);
    console.log('✅ Caméra arrêtée');
  };

  const startQRDetection = () => {
    if (!videoRef.current || !canvasRef.current) return;

    intervalRef.current = setInterval(() => {
      captureAndAnalyze();
    }, 1000); // Analyser toutes les secondes
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.videoWidth === 0 || video.videoHeight === 0) return;

    // Définir la taille du canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dessiner l'image actuelle de la vidéo sur le canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Utiliser jsQR comme solution universelle
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const qrCode = jsQR(imageData.data, canvas.width, canvas.height, {
        inversionAttempts: "dontInvert",
      });
      
      if (qrCode) {
        console.log('✅ QR Code détecté avec jsQR:', qrCode.data);
        handleQRCodeDetected(qrCode.data);
      }
    } catch (error) {
      console.error('Erreur détection QR:', error);
    }
  };

  const handleQRCodeDetected = (qrData: string) => {
    try {
      const parsedData = JSON.parse(qrData);
      
      if (parsedData.userId && parsedData.fullName && parsedData.phone) {
        onScanSuccess({
          userId: parsedData.userId,
          fullName: parsedData.fullName,
          phone: parsedData.phone
        });
        
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        setError('Format de QR Code invalide');
      }
    } catch (error) {
      console.error('Erreur parsing QR:', error);
      setError('QR Code non valide');
    }
  };

  const handleClose = () => {
    stopCamera();
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-auto">
        <h2 className="text-xl font-bold text-center mb-4">{title}</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="relative">
          {/* Video Element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 bg-black rounded-lg object-cover"
          />
          
          {/* Canvas pour la détection (invisible) */}
          <canvas
            ref={canvasRef}
            className="hidden"
          />
          
          {/* Overlay de scanning */}
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-4 border-blue-500 rounded-lg relative">
                <div className="absolute inset-0 border-2 border-white border-dashed rounded-lg animate-pulse"></div>
              </div>
            </div>
          )}
          
          {/* Indicateur de status */}
          <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
            {isScanning ? '📷 Scanning...' : '⏸️ Arrêté'}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="text-sm text-gray-600 text-center">
            Pointez la caméra vers le QR Code du destinataire
          </div>
          
          <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded text-sm">
            ✅ Détection QR universelle activée (jsQR)
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={() => startCamera()}
            disabled={isScanning}
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {isScanning ? 'En cours...' : 'Démarrer'}
          </button>
          <button
            onClick={handleClose}
            className="flex-1 border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAQRScanner;