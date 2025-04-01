
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';

interface QRDataType {
  userId: string;
  fullName: string;
  action: 'transfer';
}

const QRCodeGenerator = () => {
  const { user } = useAuth();

  // Generate QR code data for receiving money transfer
  const generateQRData = (): string => {
    if (!user?.id) return '';
    
    const qrData: QRDataType = {
      userId: user.id,
      fullName: user.user_metadata?.full_name || 'Unknown User',
      action: 'transfer',
    };
    
    return JSON.stringify(qrData);
  };

  return (
    <div className="space-y-4">
      <Card className="mt-4">
        <CardContent className="p-6 flex flex-col items-center justify-center">
          <div className="mb-4 text-center">
            <h3 className="font-semibold mb-1">
              QR Code pour recevoir de l'argent
            </h3>
            <p className="text-sm text-gray-500">
              Partagez ce QR code pour recevoir un transfert
            </p>
          </div>
          
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
              <div className="absolute bg-white rounded-full p-2">
                <img src="/sendflow-logo.png" alt="Logo" className="w-10 h-10" />
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Ce QR code contient vos informations pour recevoir un transfert d'argent
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRCodeGenerator;
