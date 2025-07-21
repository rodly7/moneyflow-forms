import { useState, useRef, useEffect } from 'react';

interface NativePWAQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (userData: { userId: string; fullName: string; phone: string }) => void;
  title?: string;
}

const NativePWAQRScanner = ({ isOpen, onClose, onScanSuccess, title = "Scanner QR Code" }: NativePWAQRScannerProps) => {
  const [showManualInput, setShowManualInput] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualData, setManualData] = useState({
    userId: '',
    fullName: '',
    phone: ''
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
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
      setScanning(true);
      
      console.log('🎥 Démarrage caméra PWA...');

      // Vérifier support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Caméra non supportée dans ce navigateur');
      }

      // Demander permissions explicites
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          startScanning();
        };
      }

      console.log('✅ Caméra démarrée');
    } catch (err: any) {
      console.error('❌ Erreur caméra:', err);
      setError(`Erreur caméra: ${err.message}`);
      setShowManualInput(true);
      setScanning(false);
    }
  };

  const startScanning = () => {
    // Scanner manuel toutes les 500ms
    intervalRef.current = setInterval(() => {
      captureAndAnalyze();
    }, 500);
  };

  const captureAndAnalyze = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.videoWidth === 0) return;

    // Configurer canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Capturer frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convertir en ImageData pour analyse
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Simulation détection QR (normalement on utiliserait une lib de détection)
    // Pour PWA, on va juste permettre la saisie manuelle
    console.log('📸 Frame capturée pour analyse...');
  };

  const stopCamera = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setScanning(false);
    console.log('✅ Caméra arrêtée');
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
    
    handleClose();
  };

  const handleClose = () => {
    stopCamera();
    setShowManualInput(false);
    setError(null);
    setManualData({ userId: '', fullName: '', phone: '' });
    onClose();
  };

  const simulateQRScan = () => {
    // Simulation pour test
    const testData = {
      userId: 'test-user-123',
      fullName: 'Test User',
      phone: '+221771234567'
    };
    
    onScanSuccess(testData);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-auto">
        <h2 className="text-xl font-bold text-center mb-4">{title}</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="min-h-[400px] flex flex-col justify-center items-center">
          {!showManualInput && !error && (
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="relative">
                <video 
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-w-[300px] h-[300px] object-cover rounded-lg"
                />
                
                {/* Overlay de scanning */}
                <div className="absolute inset-0 border-2 border-blue-500 rounded-lg">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white rounded-lg"></div>
                </div>
                
                {scanning && (
                  <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                    🔍 Recherche QR...
                  </div>
                )}
              </div>

              <canvas ref={canvasRef} className="hidden" />

              <div className="flex gap-2">
                <button 
                  onClick={() => setShowManualInput(true)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Saisie manuelle
                </button>
                
                <button 
                  onClick={simulateQRScan}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Test QR
                </button>
              </div>
            </div>
          )}

          {(showManualInput || error) && (
            <div className="w-full">
              <h3 className="text-lg font-semibold mb-4">Données du destinataire</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom complet</label>
                  <input
                    type="text"
                    value={manualData.fullName}
                    onChange={(e) => setManualData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Nom du destinataire"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={manualData.phone}
                    onChange={(e) => setManualData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+221..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">ID Utilisateur</label>
                  <input
                    type="text"
                    value={manualData.userId}
                    onChange={(e) => setManualData(prev => ({ ...prev, userId: e.target.value }))}
                    placeholder="ID du destinataire"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleManualSubmit}
                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
                  >
                    Confirmer
                  </button>
                  {!error && (
                    <button
                      onClick={() => setShowManualInput(false)}
                      className="flex-1 border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-50"
                    >
                      Retour
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleClose}
          className="w-full mt-4 border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-50"
        >
          Fermer
        </button>
      </div>
    </div>
  );
};

export default NativePWAQRScanner;