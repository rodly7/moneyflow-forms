import { useState, useRef, useEffect } from 'react';
import { Camera, X } from 'lucide-react';
import QrScanner from 'qr-scanner';

interface SimpleQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (userData: { userId: string; fullName: string; phone: string }) => void;
  title?: string;
}

const SimpleQRScanner = ({ isOpen, onClose, onScanSuccess, title = "Scanner QR Code" }: SimpleQRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualData, setManualData] = useState({
    userId: '',
    fullName: '',
    phone: ''
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        startCamera();
      }, 100);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startQRDetection = () => {
    if (!videoRef.current) return;
    
    console.log('🚀 Initialisation du scanner QR...');
    
    qrScannerRef.current = new QrScanner(
      videoRef.current,
      (result) => {
        console.log('✅ QR Code détecté:', result.data);
        try {
          // Essayer de parser les données JSON du QR code
          const userData = JSON.parse(result.data);
          if (userData.userId && userData.fullName && userData.phone) {
            onScanSuccess(userData);
            handleClose();
          } else {
            console.log('❌ Format QR Code invalide');
            setError('Format QR Code invalide');
          }
        } catch (e) {
          console.log('❌ Erreur parsing QR Code:', e);
          // Essayer d'utiliser directement la donnée comme text
          if (typeof result.data === 'string' && result.data.includes('userId')) {
            // Si c'est un string qui contient userId, on essaie de l'utiliser
            onScanSuccess({
              userId: result.data,
              fullName: 'Utilisateur scanné',
              phone: 'Non disponible'
            });
            handleClose();
          } else {
            setError('QR Code non reconnu');
          }
        }
      },
      {
        returnDetailedScanResult: true,
        highlightScanRegion: true,
        highlightCodeOutline: true,
        preferredCamera: 'environment',
        maxScansPerSecond: 5,
        calculateScanRegion: (video) => {
          const smallestDimension = Math.min(video.videoWidth, video.videoHeight);
          const scanRegionSize = Math.round(2/3 * smallestDimension);
          return {
            x: Math.round((video.videoWidth - scanRegionSize) / 2),
            y: Math.round((video.videoHeight - scanRegionSize) / 2),
            width: scanRegionSize,
            height: scanRegionSize,
          };
        }
      }
    );

    qrScannerRef.current.start().then(() => {
      console.log('✅ Scanner QR démarré');
      setIsScanning(true);
    }).catch((error) => {
      console.error('❌ Erreur démarrage scanner:', error);
      setError('Erreur du scanner QR');
      setShowManualInput(true);
    });
  };

  const startCamera = async () => {
    try {
      setError(null);
      console.log('🎥 Tentative de démarrage de la caméra...');

      // Vérifier si getUserMedia est disponible
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia non supporté sur ce navigateur');
      }

      // Contraintes plus simples pour PWA
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 480 },
          height: { ideal: 360 }
        }
      };

      console.log('📋 Demande des permissions caméra...');
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Permissions accordées, configuration du stream...');
      
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        videoRef.current.onloadedmetadata = () => {
          console.log('📺 Métadonnées vidéo chargées');
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              console.log('▶️ Lecture vidéo démarrée');
              setIsScanning(true);
              startQRDetection();
            }).catch(err => {
              console.error('❌ Erreur lecture vidéo:', err);
              setError('Erreur lors du démarrage de la vidéo');
            });
          }
        };

        videoRef.current.onerror = (err) => {
          console.error('❌ Erreur élément vidéo:', err);
          setError('Erreur de l\'élément vidéo');
        };
      }

      console.log('✅ Caméra configurée avec succès');
    } catch (error: any) {
      console.error('❌ Erreur caméra complète:', error);
      const errorMessage = error.name === 'NotAllowedError' 
        ? 'Permissions caméra refusées. Veuillez autoriser l\'accès.'
        : error.name === 'NotFoundError'
        ? 'Aucune caméra trouvée sur cet appareil.'
        : `Erreur caméra: ${error.message}`;
      
      setError(errorMessage);
      setShowManualInput(true);
    }
  };


  const stopCamera = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
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
    setError(null);
    setShowManualInput(false);
    setManualData({ userId: '', fullName: '', phone: '' });
    onClose();
  };

  const simulateQRScan = () => {
    const testData = {
      userId: 'dda64997-5dbd-4a5f-b049-cd68ed31fe40',
      fullName: 'Laureat NGANGOUE',
      phone: '+242065224790'
    };
    
    onScanSuccess(testData);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {!showManualInput ? (
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 bg-black rounded-lg object-cover"
               />
               
               
               {isScanning && (
                 <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-48 h-48 border-4 border-blue-500 rounded-lg relative">
                     <div className="absolute inset-0 border-2 border-white border-dashed rounded-lg animate-pulse"></div>
                   </div>
                 </div>
               )}
               
               <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                 {isScanning ? '🔍 Recherche QR...' : '⏸️ Arrêté'}
               </div>
               
                <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm text-center">
                  Détection automatique activée
                </div>
            </div>

            <div className="text-sm text-gray-600 text-center">
              Pointez la caméra vers le QR Code du destinataire
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-600 mb-2">💡 Pour tester rapidement :</p>
              <button
                onClick={simulateQRScan}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 text-sm"
              >
                Utiliser données de test
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowManualInput(true)}
                className="flex-1 border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-50"
              >
                Saisie manuelle
              </button>
              <button
                onClick={() => startCamera()}
                disabled={isScanning}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Camera size={16} />
                {isScanning ? 'En cours...' : 'Scanner'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Données du destinataire</h3>

            <div>
              <label className="block text-sm font-medium mb-2">Nom complet</label>
              <input
                type="text"
                value={manualData.fullName}
                onChange={(e) => setManualData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Nom du destinataire"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Téléphone</label>
              <input
                type="text"
                value={manualData.phone}
                onChange={(e) => setManualData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+221..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">ID Utilisateur</label>
              <input
                type="text"
                value={manualData.userId}
                onChange={(e) => setManualData(prev => ({ ...prev, userId: e.target.value }))}
                placeholder="ID du destinataire"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-600 mb-2">💡 Pour tester rapidement :</p>
              <button
                onClick={simulateQRScan}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 text-sm"
              >
                Utiliser données de test
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleManualSubmit}
                className="flex-1 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
              >
                Confirmer
              </button>
              <button
                onClick={() => setShowManualInput(false)}
                className="flex-1 border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-50"
              >
                Retour caméra
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleQRScanner;