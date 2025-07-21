import { useState, useRef, useEffect } from 'react';

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
        maxWidth: '400px',
        width: '90%',
        maxHeight: '90%',
        overflow: 'auto'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Scanner QR Code</h2>
        
        <div style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          {!showManualInput && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                width: '300px', 
                height: '300px', 
                backgroundColor: '#f5f5f5', 
                borderRadius: '8px', 
                position: 'relative', 
                overflow: 'hidden' 
              }}>
                {cameraStarted ? (
                  <video
                    ref={videoRef}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                    playsInline
                    muted
                    autoPlay
                  />
                ) : (
                  <div style={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)' 
                  }}>
                    <p>Démarrage caméra...</p>
                  </div>
                )}
              </div>

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

export default PaymentQRScanner;