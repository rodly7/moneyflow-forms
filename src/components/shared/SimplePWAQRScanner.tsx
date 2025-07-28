import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface SimplePWAQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (userData: { userId: string; fullName: string; phone: string }) => void;
  title?: string;
}

const SimplePWAQRScanner = ({ isOpen, onClose, onScanSuccess, title = "Scanner QR" }: SimplePWAQRScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualData, setManualData] = useState({
    userId: '',
    fullName: '',
    phone: ''
  });

  const handleSubmit = () => {
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

  const startScanning = async () => {
    try {
      console.log('🔄 Tentative de démarrage du scanner...');
      setError('');
      setIsScanning(true);
      
      const scanner = new Html5Qrcode("qr-reader-pwa");
      scannerRef.current = scanner;
      
      console.log('📷 Demande d\'accès à la caméra...');
      
      await scanner.start(
        { facingMode: "environment" }, // Simplifié pour la caméra arrière
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          console.log('✅ QR Code scanné:', decodedText);
          try {
            const userData = JSON.parse(decodedText);
            if (userData.userId && userData.fullName && userData.phone) {
              onScanSuccess(userData);
              handleClose();
            } else {
              throw new Error('Format invalide');
            }
          } catch {
            // Si ce n'est pas du JSON valide, utiliser comme données brutes
            onScanSuccess({
              userId: 'scan-' + Date.now(),
              fullName: decodedText.substring(0, 20),
              phone: decodedText
            });
            handleClose();
          }
        },
        (errorMessage) => {
          // Erreur de scan (normale, pas critique)
          console.log('🔍 Scan en cours...', errorMessage);
        }
      );
      
      console.log('✅ Scanner démarré avec succès');
    } catch (err: any) {
      console.error('❌ Erreur scanner:', err);
      setError(`Erreur caméra: ${err.message || 'Impossible d\'accéder à la caméra'}`);
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error('Erreur arrêt scanner:', err);
      }
    }
    setIsScanning(false);
  };

  const handleClose = async () => {
    await stopScanning();
    setManualData({ userId: '', fullName: '', phone: '' });
    setShowManualInput(false);
    setError('');
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

  useEffect(() => {
    console.log('🔍 SimplePWAQRScanner useEffect:', { isOpen, showManualInput, isScanning });
    
    if (isOpen && !showManualInput) {
      console.log('📱 Lancement du scanner automatiquement...');
      // Délai pour laisser le DOM se mettre à jour
      setTimeout(() => {
        startScanning();
      }, 100);
    }
    
    return () => {
      if (isOpen) {
        console.log('🛑 Nettoyage du scanner...');
        stopScanning();
      }
    };
  }, [isOpen, showManualInput]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-[9999] overflow-hidden">
      {!showManualInput ? (
        // Mode scanner QR automatique
        <div className="w-full h-full relative flex flex-col">
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white z-10"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          <button 
            onClick={() => setShowManualInput(true)}
            className="absolute top-4 right-14 w-8 h-8 flex items-center justify-center text-white z-10"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
              <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
              <path d="m2 2 7.586 7.586"></path>
              <circle cx="11" cy="11" r="2"></circle>
            </svg>
          </button>
          
          <div className="flex-1 relative">
            <div 
              id="qr-reader-pwa" 
              className="w-full h-full"
            />
            
            {/* Cadre de scan superposé */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-64 h-64">
                {/* Coins du cadre de scan */}
                <div className="absolute top-0 left-0 w-8 h-8 border-l-4 border-t-4 border-white"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-r-4 border-t-4 border-white"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-l-4 border-b-4 border-white"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-4 border-b-4 border-white"></div>
                
                {/* Zone de scan avec bordure */}
                <div className="absolute inset-2 border-2 border-white/30 rounded-lg"></div>
              </div>
            </div>
            
            {/* Overlay sombre autour du cadre */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full bg-black/50" style={{
                background: `
                  linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.7) calc(50% - 128px), transparent calc(50% - 128px), transparent calc(50% + 128px), rgba(0,0,0,0.7) calc(50% + 128px), rgba(0,0,0,0.7) 100%),
                  linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.7) calc(50% - 128px), transparent calc(50% - 128px), transparent calc(50% + 128px), rgba(0,0,0,0.7) calc(50% + 128px), rgba(0,0,0,0.7) 100%)
                `
              }}></div>
            </div>
          </div>
          
          {error && (
            <div className="absolute top-1/2 left-4 right-4 bg-red-500/90 text-white p-3 rounded-lg text-center">
              {error}
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <div className="text-center mb-6">
              <p className="text-white text-lg font-medium mb-2">Scanner un Code QR pour payer ou envoyer</p>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={simulateQRScan}
                className="flex-1 bg-white/90 text-black py-4 px-6 rounded-full font-medium text-lg"
              >
                Scanner un code
              </button>
              <button
                onClick={() => setShowManualInput(true)}
                className="bg-transparent border border-white/30 text-white py-4 px-6 rounded-full font-medium text-lg"
              >
                Ma carte
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Mode saisie manuelle
        <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-auto shadow-2xl border-2 border-blue-200 m-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">{title}</h2>
            <button 
              onClick={() => setShowManualInput(false)}
              className="text-blue-500 text-sm"
            >
              Scanner QR
            </button>
          </div>
          
          <div className="space-y-4">
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

            <div className="flex gap-2 pt-4">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-green-500 text-white py-3 px-4 rounded-md hover:bg-green-600 font-medium"
              >
                Confirmer
              </button>
              <button
                onClick={handleClose}
                className="flex-1 border border-gray-300 py-3 px-4 rounded-md hover:bg-gray-50 font-medium"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimplePWAQRScanner;