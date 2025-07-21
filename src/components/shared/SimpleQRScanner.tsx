import { useState, useRef, useEffect } from 'react';
import { Camera, X } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface SimpleQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (userData: { userId: string; fullName: string; phone: string }) => void;
  title?: string;
}

const SimpleQRScanner = ({ isOpen, onClose, onScanSuccess, title = "Scanner QR Code" }: SimpleQRScannerProps) => {
  const [error, setError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [manualData, setManualData] = useState({
    userId: '',
    fullName: '',
    phone: ''
  });
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerElementId = "qr-reader";

  useEffect(() => {
    if (isOpen && !showManualInput) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, showManualInput]);

  const startScanner = () => {
    if (scannerRef.current) {
      stopScanner();
    }

    console.log('🚀 Démarrage du scanner HTML5 QR Code...');
    setError(null);
    setIsScanning(true);

    try {
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        rememberLastUsedCamera: true,
        // Prefer environment camera (back camera)
        cameraIdOrConfig: { facingMode: "environment" },
        // Support more formats
        supportedScanTypes: [0], // QR_CODE
        // Verbose logging
        verbose: true,
        // Show zoom slider
        showZoomSliderIfSupported: true,
        // Show torch button if supported
        showTorchButtonIfSupported: true
      };

      scannerRef.current = new Html5QrcodeScanner(
        scannerElementId,
        config,
        /* verbose= */ false
      );

      scannerRef.current.render(handleQRScanSuccess, onScanFailure);
      console.log('✅ Scanner HTML5 QR Code initialisé');

    } catch (error) {
      console.error('❌ Erreur initialisation scanner:', error);
      setError('Erreur lors de l\'initialisation du scanner');
      setIsScanning(false);
      setShowManualInput(true);
    }
  };

  const handleQRScanSuccess = (decodedText: string, decodedResult: any) => {
    console.log('🎉 QR Code détecté!');
    console.log('📄 Contenu:', decodedText);
    console.log('📋 Résultat détaillé:', decodedResult);

    try {
      // Essayer de parser les données JSON
      const userData = JSON.parse(decodedText);
      if (userData.userId && userData.fullName && userData.phone) {
        console.log('✅ Format QR valide:', userData);
        onScanSuccess(userData);
        handleClose();
        return;
      } else {
        console.log('❌ Format QR Code invalide - manque des champs:', userData);
      }
    } catch (e) {
      console.log('❌ Erreur parsing JSON:', e);
      console.log('🔤 Tentative d\'utilisation comme texte brut');
    }

    // Fallback: accepter n'importe quel QR code pour test
    onScanSuccess({
      userId: decodedText,
      fullName: 'Utilisateur QR',
      phone: 'Détecté depuis QR'
    });
    handleClose();
  };

  const onScanFailure = (error: string) => {
    // Ne pas loguer les erreurs de scan normales (trop verbeux)
    // console.log('Scan en cours...', error);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
        console.log('🛑 Scanner arrêté');
      } catch (error) {
        console.log('⚠️ Erreur lors de l\'arrêt du scanner:', error);
      }
      scannerRef.current = null;
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
    stopScanner();
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
            {/* Zone de scan QR */}
            <div id={scannerElementId} className="w-full"></div>
            
            {!isScanning && (
              <div className="text-center text-gray-600">
                Initialisation du scanner...
              </div>
            )}

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
                Retour scanner
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleQRScanner;