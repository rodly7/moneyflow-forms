import { useState, useEffect } from 'react';
import { Camera, X, QrCode } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import QRCode from 'qrcode.react';

interface SimpleQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (userData: { userId: string; fullName: string; phone: string }) => void;
  title?: string;
}

const SimpleQRScanner = ({ isOpen, onClose, onScanSuccess, title = "Scanner QR Code" }: SimpleQRScannerProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [showTestQR, setShowTestQR] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const qrCodeRegionId = "qr-reader-region";

  useEffect(() => {
    if (isOpen) {
      initializeCameras();
    } else {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const initializeCameras = async () => {
    try {
      console.log('🎥 Recherche des caméras disponibles...');
      const devices = await Html5Qrcode.getCameras();
      console.log('📷 Caméras trouvées:', devices);
      
      setCameras(devices);
      
      // Préférer la caméra arrière
      const backCamera = devices.find(camera => 
        camera.label?.toLowerCase().includes('back') || 
        camera.label?.toLowerCase().includes('rear') ||
        camera.label?.toLowerCase().includes('environment')
      );
      
      const cameraToUse = backCamera || devices[0];
      if (cameraToUse) {
        setSelectedCamera(cameraToUse.id);
        startScanning(cameraToUse.id);
      } else {
        setError('Aucune caméra trouvée');
      }
    } catch (err: any) {
      console.error('❌ Erreur lors de la recherche des caméras:', err);
      setError(`Erreur caméra: ${err.message}`);
    }
  };

  const startScanning = async (cameraId: string) => {
    if (html5QrCode) {
      await stopScanning();
    }

    try {
      console.log('🚀 Démarrage du scan avec caméra:', cameraId);
      setError(null);
      setIsScanning(true);

      const qrCodeInstance = new Html5Qrcode(qrCodeRegionId);
      setHtml5QrCode(qrCodeInstance);

      // Configuration optimisée pour une détection ultra-rapide
      const config = {
        fps: 30, // FPS maximum pour une détection très rapide
        qrbox: function(viewfinderWidth: number, viewfinderHeight: number) {
          // Zone de scan plus petite pour une détection plus rapide
          let minEdgePercentage = 0.5; // 50% de la zone pour plus de rapidité
          let minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
          let qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
          return {
            width: qrboxSize,
            height: qrboxSize
          };
        },
        aspectRatio: 1.0,
        // Paramètres de détection optimisés pour la vitesse
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        },
        rememberLastUsedCamera: false,
        supportedScanTypes: [0], // QR_CODE uniquement pour plus de rapidité
      };

      await qrCodeInstance.start(
        cameraId,
        config,
        (decodedText, decodedResult) => {
          console.log('🎉 QR Code détecté:', decodedText);
          console.log('📋 Résultat détaillé:', decodedResult);
          handleQRCodeScan(decodedText);
        },
        (errorMessage) => {
          // Ne loguer que les vraies erreurs, pas les tentatives de scan normales
          if (errorMessage && !errorMessage.includes('NotFoundException')) {
            console.log('ℹ️ Info scan:', errorMessage);
          }
        }
      );

      console.log('✅ Scanner démarré avec succès');
    } catch (err: any) {
      console.error('❌ Erreur lors du démarrage du scanner:', err);
      setError(`Erreur scanner: ${err.message}`);
      setIsScanning(false);
    }
  };

  const handleQRCodeScan = (decodedText: string) => {
    // Éviter les détections multiples rapides
    if (isProcessing) return;
    setIsProcessing(true);
    
    console.log('📄 Contenu QR scanné:', decodedText);
    
    try {
      // Essayer de parser comme JSON
      const userData = JSON.parse(decodedText);
      if (userData.userId && userData.fullName && userData.phone) {
        console.log('✅ QR Code valide:', userData);
        onScanSuccess(userData);
        handleClose();
        return;
      }
    } catch (e) {
      console.log('❌ Pas un JSON valide, traitement comme texte...');
    }

    // Traitement pour différents formats de QR
    if (decodedText.includes('userId') || decodedText.includes('user')) {
      // Format texte avec userId
      onScanSuccess({
        userId: decodedText,
        fullName: 'Utilisateur QR',
        phone: 'Détecté depuis QR'
      });
    } else if (decodedText.startsWith('+') || /^\d+$/.test(decodedText)) {
      // Numéro de téléphone
      onScanSuccess({
        userId: 'qr-' + Date.now(),
        fullName: 'Utilisateur QR',
        phone: decodedText
      });
    } else {
      // Autre contenu
      onScanSuccess({
        userId: 'qr-' + Date.now(),
        fullName: decodedText.substring(0, 30),
        phone: 'QR: ' + decodedText.substring(0, 15)
      });
    }
    
    handleClose();
  };

  const stopScanning = async () => {
    if (html5QrCode) {
      try {
        console.log('🛑 Arrêt du scanner...');
        if (html5QrCode.getState() === 2) { // SCANNING state
          await html5QrCode.stop();
        }
        html5QrCode.clear();
        console.log('✅ Scanner arrêté');
      } catch (err: any) {
        console.log('⚠️ Erreur lors de l\'arrêt:', err.message);
      }
      setHtml5QrCode(null);
    }
    setIsScanning(false);
  };

  const changeCamera = async (cameraId: string) => {
    setSelectedCamera(cameraId);
    if (isScanning) {
      await startScanning(cameraId);
    }
  };

  const handleClose = async () => {
    await stopScanning();
    setError(null);
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

  const testQRData = JSON.stringify({
    userId: 'dda64997-5dbd-4a5f-b049-cd68ed31fe40',
    fullName: 'Laureat NGANGOUE',
    phone: '+242065224790'
  });

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
            <p>{error}</p>
            <button 
              onClick={initializeCameras}
              className="mt-2 text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Réessayer
            </button>
          </div>
        )}

        <div className="space-y-4">
          {/* Sélecteur de caméra */}
          {cameras.length > 1 && (
            <div>
              <label className="block text-sm font-medium mb-2">Caméra:</label>
              <select 
                value={selectedCamera} 
                onChange={(e) => changeCamera(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {cameras.map((camera) => (
                  <option key={camera.id} value={camera.id}>
                    {camera.label || `Caméra ${camera.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Zone de scan */}
          <div className="relative">
            <div id={qrCodeRegionId} className="w-full min-h-[300px] border rounded-lg overflow-hidden"></div>
            
            {!isScanning && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <Camera size={48} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-600">Initialisation de la caméra...</p>
                </div>
              </div>
            )}
          </div>

          {isScanning && (
            <div className="text-center">
              <p className="text-green-600 font-medium">📷 Scanner actif - Pointez vers un QR Code</p>
            </div>
          )}

          {/* Boutons */}
          <div className="space-y-2">
            <button
              onClick={() => setShowTestQR(!showTestQR)}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 flex items-center justify-center gap-2"
            >
              <QrCode size={20} />
              {showTestQR ? 'Masquer QR de test' : 'Afficher QR de test'}
            </button>

            {showTestQR && (
              <div className="bg-white p-4 rounded-lg border-2 border-green-500">
                <div className="text-center mb-2">
                  <p className="text-sm font-medium text-green-700">QR Code de test - Scannez-le !</p>
                </div>
                <div className="flex justify-center">
                  <QRCode 
                    value={testQRData} 
                    size={200}
                    level="M"
                    includeMargin={true}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2 text-center">
                  Utilisez un autre appareil pour scanner ce QR
                </p>
              </div>
            )}
            
            <button
              onClick={simulateQRScan}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
            >
              🧪 Données de test (simulation)
            </button>
            
            <button
              onClick={handleClose}
              className="w-full border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-50"
            >
              Fermer
            </button>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              💡 <strong>Instructions :</strong> Pointez la caméra vers un QR code. Le scan se fait automatiquement dès détection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleQRScanner;