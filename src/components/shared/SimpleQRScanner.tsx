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
        
        await scanner.start(
          { facingMode: "environment" }, // Force caméra arrière
          { 
            fps: 30,
            qrbox: { width: 250, height: 250 }, // Zone de scan carrée
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
      {/* Header avec bouton fermer */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        zIndex: 10001
      }}>
        <span style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
          Scanner QR Code
        </span>
        <button 
          onClick={onClose}
          style={{
            backgroundColor: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>
      </div>

      {/* Zone de scan avec overlay */}
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div 
          id="qr-reader" 
          style={{ 
            width: '100%',
            height: '100%'
          }}
        />
        
        {/* Overlay avec cadre carré */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 10000
        }}>
          {/* Zone sombre autour du cadre */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)'
          }} />
          
          {/* Cadre carré transparent au centre */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '280px',
            height: '280px',
            transform: 'translate(-50%, -50%)',
            border: '3px solid #00ff00',
            borderRadius: '20px',
            backgroundColor: 'transparent',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
          }}>
            {/* Coins du cadre */}
            <div style={{
              position: 'absolute',
              top: '-3px',
              left: '-3px',
              width: '30px',
              height: '30px',
              borderTop: '6px solid #00ff00',
              borderLeft: '6px solid #00ff00',
              borderRadius: '20px 0 0 0'
            }} />
            <div style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              width: '30px',
              height: '30px',
              borderTop: '6px solid #00ff00',
              borderRight: '6px solid #00ff00',
              borderRadius: '0 20px 0 0'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-3px',
              left: '-3px',
              width: '30px',
              height: '30px',
              borderBottom: '6px solid #00ff00',
              borderLeft: '6px solid #00ff00',
              borderRadius: '0 0 0 20px'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-3px',
              right: '-3px',
              width: '30px',
              height: '30px',
              borderBottom: '6px solid #00ff00',
              borderRight: '6px solid #00ff00',
              borderRadius: '0 0 20px 0'
            }} />
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        position: 'absolute',
        bottom: '80px',
        left: '20px',
        right: '20px',
        textAlign: 'center',
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '15px',
        borderRadius: '10px',
        zIndex: 10001
      }}>
        <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
          📱 Centrez le QR code dans le cadre vert
        </p>
        <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
          Maintenez l'appareil stable pour une détection rapide
        </p>
      </div>

      {/* Erreur */}
      {error && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          right: '20px',
          backgroundColor: '#ff4444',
          color: 'white',
          padding: '15px',
          borderRadius: '10px',
          textAlign: 'center',
          zIndex: 10001
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>❌ Erreur</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>{error}</p>
        </div>
      )}
    </div>
  );
};

export default SimpleQRScanner;