
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface QRDataType {
  userId: string;
  fullName: string;
  action: 'transfer' | 'withdraw';
  withdrawalId?: string;
  amount?: string;
}

interface QRCodeGeneratorProps {
  action?: 'transfer' | 'withdraw';
  withdrawalId?: string;
  amount?: string;
  showCard?: boolean;
  userAvatar?: string;
  userName?: string;
}

const QRCodeGenerator = ({ 
  action = 'transfer', 
  withdrawalId, 
  amount, 
  showCard = true,
  userAvatar,
  userName
}: QRCodeGeneratorProps) => {
  const { user } = useAuth();

  // Generate QR code data for the specified action
  const generateQRData = (): string => {
    if (!user?.id) return '';
    
    const qrData: QRDataType = {
      userId: user.id,
      fullName: user.user_metadata?.full_name || userName || 'Unknown User',
      action: action,
    };

    // Add withdrawal specific data if applicable
    if (action === 'withdraw' && withdrawalId) {
      qrData.withdrawalId = withdrawalId;
      qrData.amount = amount;
    }
    
    return JSON.stringify(qrData);
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const qrCodeContent = (
    <div className="bg-white p-4 rounded-lg border shadow-md">
      <div className="relative flex items-center justify-center w-56 h-56 bg-gray-100 rounded-lg">
        <QRCodeSVG 
          value={generateQRData()} 
          size={200}
          bgColor={"#ffffff"}
          fgColor={"#000000"}
          level={"H"}
          includeMargin={false}
        />
        <div className="absolute bg-white rounded-full p-1">
          {userAvatar ? (
            <Avatar className="w-12 h-12">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback className="bg-emerald-100 text-emerald-600">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <img src="/sendflow-logo.png" alt="Logo" className="w-10 h-10" />
          )}
        </div>
      </div>
    </div>
  );

  if (!showCard) {
    return qrCodeContent;
  }

  return (
    <div className="space-y-4">
      <Card className="mt-4">
        <CardContent className="p-6 flex flex-col items-center justify-center">
          <div className="mb-4 text-center">
            <h3 className="font-semibold mb-1">
              {action === 'transfer' ? 'QR Code pour recevoir de l\'argent' : 'QR Code de retrait'}
            </h3>
            <p className="text-sm text-gray-500">
              {action === 'transfer' 
                ? 'Partagez ce QR code pour recevoir un transfert' 
                : 'Présentez ce QR code pour effectuer votre retrait'}
            </p>
          </div>
          
          {qrCodeContent}
          
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              {action === 'transfer'
                ? 'Ce QR code contient vos informations pour recevoir un transfert d\'argent'
                : 'Ce QR code contient les informations de votre demande de retrait'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRCodeGenerator;
