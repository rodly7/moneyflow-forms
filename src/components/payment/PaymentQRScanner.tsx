import SimplePWAQRScanner from '@/components/shared/SimplePWAQRScanner';

interface PaymentQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (userData: { userId: string; fullName: string; phone: string }) => void;
}

const PaymentQRScanner = ({ isOpen, onClose, onScanSuccess }: PaymentQRScannerProps) => {
  return (
    <SimplePWAQRScanner
      isOpen={isOpen}
      onClose={onClose}
      onScanSuccess={onScanSuccess}
      title="Scanner pour payer"
    />
  );
};

export default PaymentQRScanner;