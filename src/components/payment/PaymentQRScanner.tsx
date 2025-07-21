import PWAQRScanner from '@/components/shared/PWAQRScanner';

interface PaymentQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (userData: { userId: string; fullName: string; phone: string }) => void;
}

const PaymentQRScanner = ({ isOpen, onClose, onScanSuccess }: PaymentQRScannerProps) => {
  return (
    <PWAQRScanner
      isOpen={isOpen}
      onClose={onClose}
      onScanSuccess={onScanSuccess}
      title="Scanner QR Code Paiement"
    />
  );
};

export default PaymentQRScanner;