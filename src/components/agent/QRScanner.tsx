
import SimplePWAQRScanner from '@/components/shared/SimplePWAQRScanner';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (userData: { userId: string; fullName: string; phone: string }) => void;
}

const QRScanner = ({ isOpen, onClose, onScanSuccess }: QRScannerProps) => {
  return (
    <SimplePWAQRScanner
      isOpen={isOpen}
      onClose={onClose}
      onScanSuccess={onScanSuccess}
      title="Scanner pour agent"
    />
  );
};

export default QRScanner;
