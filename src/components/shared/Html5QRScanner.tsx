import { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

interface Html5QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (userData: { userId: string; fullName: string; phone: string }) => void;
  title?: string;
}

const Html5QRScanner = ({ isOpen, onClose, onScanSuccess, title = "Scanner QR Code" }: Html5QRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualData, setManualData] = useState({
    userId: '',
    fullName: '',
    phone: ''
  });
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerElementId = `qr-scanner-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    if (isOpen) {
      console.log('🎥 Initialisation du scanner HTML5...');
      setIsScanning(false);
      setShowManualInput(false);
      setManualData({ userId: '', fullName: '', phone: '' });
      
      // Attendre que le DOM soit prêt
      setTimeout(() => {
        initializeScanner();
      }, 100);
    } else {
      cleanupScanner();
    }

    return () => {
      cleanupScanner();
    };
  }, [isOpen]);

  const cleanupScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
        scannerRef.current = null;
        console.log('✅ Scanner nettoyé');
      } catch (error) {
        console.warn('Erreur lors du nettoyage:', error);
      }
    }
    setIsScanning(false);
  };

  const initializeScanner = () => {
    try {
      const scanner = new Html5QrcodeScanner(
        scannerElementId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        },
        false
      );

      scanner.render(
        (decodedText) => {
          console.log('✅ QR Code scanné:', decodedText);
          handleScanSuccess(decodedText);
        },
        (error) => {
          // Erreurs de scan normales - ne pas logger
        }
      );

      scannerRef.current = scanner;
      setIsScanning(true);
      console.log('✅ Scanner HTML5 initialisé');
    } catch (error) {
      console.error('❌ Erreur initialisation scanner:', error);
      setShowManualInput(true);
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    try {
      console.log('Parsing QR data:', decodedText);
      
      // Essayer de parser le JSON
      const qrData = JSON.parse(decodedText);
      
      if (qrData.userId && qrData.fullName && qrData.phone) {
        onScanSuccess({
          userId: qrData.userId,
          fullName: qrData.fullName,
          phone: qrData.phone
        });
        
        // Fermer après succès
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        console.warn('Données QR incomplètes:', qrData);
        alert('QR Code invalide - données manquantes');
      }
    } catch (error) {
      console.error('Erreur parsing QR:', error);
      alert('Format de QR Code invalide');
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
    cleanupScanner();
    setShowManualInput(false);
    setManualData({ userId: '', fullName: '', phone: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '90%',
        overflow: 'auto'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>{title}</h2>
        
        <div style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          {!showManualInput && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', width: '100%' }}>
              <div 
                id={scannerElementId}
                style={{ 
                  width: '100%',
                  minHeight: '300px'
                }}
              />

              <button 
                onClick={() => setShowManualInput(true)}
                style={{ 
                  padding: '8px 24px', 
                  border: '1px solid #ccc', 
                  borderRadius: '6px', 
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                Saisie manuelle
              </button>
            </div>
          )}

          {showManualInput && (
            <div style={{ width: '100%' }}>
              <h3 style={{ marginBottom: '16px' }}>Données du destinataire</h3>

              <div style={{ marginBottom: '12px' }}>
                <label htmlFor="fullName" style={{ display: 'block', marginBottom: '4px' }}>Nom complet</label>
                <input
                  id="fullName"
                  type="text"
                  value={manualData.fullName}
                  onChange={(e) => setManualData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Nom du destinataire"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <label htmlFor="phone" style={{ display: 'block', marginBottom: '4px' }}>Téléphone</label>
                <input
                  id="phone"
                  type="text"
                  value={manualData.phone}
                  onChange={(e) => setManualData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+221..."
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="userId" style={{ display: 'block', marginBottom: '4px' }}>ID Utilisateur</label>
                <input
                  id="userId"
                  type="text"
                  value={manualData.userId}
                  onChange={(e) => setManualData(prev => ({ ...prev, userId: e.target.value }))}
                  placeholder="ID du destinataire"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button
                  onClick={handleManualSubmit}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Confirmer
                </button>
                <button
                  onClick={() => setShowManualInput(false)}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Retour
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleClose}
            style={{
              width: '100%',
              padding: '8px 16px',
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default Html5QRScanner;