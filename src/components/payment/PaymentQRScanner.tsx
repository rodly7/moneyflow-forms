import SimplePWAQRScanner from '@/components/shared/SimplePWAQRScanner';

interface PaymentQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (userData: { userId: string; fullName: string; phone: string }) => void;
  onMyCard?: () => void;
}

const PaymentQRScanner = ({ isOpen, onClose, onScanSuccess, onMyCard }: PaymentQRScannerProps) => {
  return (
    <SimplePWAQRScanner
      isOpen={isOpen}
      onClose={onClose}
      onScanSuccess={onScanSuccess}
      title="Scanner pour payer"
      variant="payment"
      onMyCard={onMyCard}
    />
  );
};

export default PaymentQRScanner;