
import Html5QRScanner from '@/components/shared/Html5QRScanner';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (userData: { userId: string; fullName: string; phone: string }) => void;
}

const QRScanner = ({ isOpen, onClose, onScanSuccess }: QRScannerProps) => {
  return (
    <Html5QRScanner
      isOpen={isOpen}
      onClose={onClose}
      onScanSuccess={onScanSuccess}
      title="Scanner le QR Code client"
    />
  );
};

export default QRScanner;
