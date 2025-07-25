import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface SimpleQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (userData: { userId: string; fullName: string; phone: string }) => void;
}

const SimpleQRScanner = ({ isOpen, onClose, onScanSuccess }: SimpleQRScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string>('');
  
  useEffect(() => {
    if (!isOpen) return;
    
    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;
        
        // Obtenir la liste des caméras et forcer la caméra arrière
        const devices = await Html5Qrcode.getCameras();
        console.log('Caméras disponibles:', devices);
        
        // Chercher explicitement la caméra arrière
        let backCamera = devices.find(device => 
          device.label?.toLowerCase().includes('back') ||
          device.label?.toLowerCase().includes('rear') ||
          device.label?.toLowerCase().includes('environment') ||
          device.label?.toLowerCase().includes('principale') ||
          device.id?.includes('1') // Souvent la caméra arrière a l'ID avec '1'
        );
        
        // Si pas trouvée, prendre la dernière caméra (souvent la principale)
        if (!backCamera && devices.length > 1) {
          backCamera = devices[devices.length - 1];
        }
        
        const cameraToUse = backCamera || devices[0];
        console.log('Caméra sélectionnée:', cameraToUse);
        
        await scanner.start(
          cameraToUse.id, // Utiliser l'ID explicite de la caméra
          { 
            fps: 30,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            disableFlip: false,
            videoConstraints: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 }
            }
          },
          (decodedText) => {
            try {
              const userData = JSON.parse(decodedText);
              if (userData.userId && userData.fullName && userData.phone) {
                onScanSuccess(userData);
                onClose();
              }
            } catch {
              onScanSuccess({
                userId: 'scan-' + Date.now(),
                fullName: decodedText.substring(0, 20),
                phone: decodedText
              });
              onClose();
            }
          },
          () => {} // errorCallback
        );
      } catch (err: any) {
        setError(err.message);
      }
    };
    
    startScanner();
    
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [isOpen, onScanSuccess, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'black',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <button 
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          fontSize: '20px',
          cursor: 'pointer',
          zIndex: 10000
        }}
      >
        ×
      </button>
      
      <div 
        id="qr-reader" 
        style={{ 
          width: '100%',
          height: '100%'
        }}
      />
      
      {error && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          right: '20px',
          backgroundColor: 'red',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default SimpleQRScanner;