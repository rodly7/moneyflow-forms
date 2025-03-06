
import React, { useState } from 'react';
import { QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface QRDataType {
  userId: string;
  fullName: string;
  amount?: number;
  action: 'transfer' | 'payment';
}

const QRCodeGenerator = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState<string>('');
  const [showQR, setShowQR] = useState(false);
  const [qrAction, setQrAction] = useState<'transfer' | 'payment'>('transfer');

  // Generate QR code data
  const generateQRData = (): string => {
    if (!user?.id) return '';
    
    const qrData: QRDataType = {
      userId: user.id,
      fullName: user.user_metadata?.full_name || 'Unknown User',
      action: qrAction,
    };
    
    if (amount && !isNaN(Number(amount))) {
      qrData.amount = Number(amount);
    }
    
    return JSON.stringify(qrData);
  };

  const handleGenerate = () => {
    if (qrAction === 'payment' && (!amount || isNaN(Number(amount)) || Number(amount) <= 0)) {
      toast({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide pour le paiement",
        variant: "destructive"
      });
      return;
    }
    
    setShowQR(true);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="qrtype">Type de QR Code</Label>
        <div className="flex gap-2">
          <Button 
            variant={qrAction === 'transfer' ? "default" : "outline"}
            onClick={() => setQrAction('transfer')}
            className="flex-1"
          >
            Recevoir un transfert
          </Button>
          <Button 
            variant={qrAction === 'payment' ? "default" : "outline"}
            onClick={() => setQrAction('payment')}
            className="flex-1"
          >
            Recevoir un paiement
          </Button>
        </div>
      </div>

      {qrAction === 'payment' && (
        <div className="space-y-2">
          <Label htmlFor="amount">Montant (XAF)</Label>
          <Input
            id="amount"
            type="number"
            placeholder="Entrez le montant"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      )}

      <Button 
        onClick={handleGenerate} 
        className="w-full bg-emerald-600 hover:bg-emerald-700"
      >
        Générer le QR Code
      </Button>

      {showQR && (
        <Card className="mt-4">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="mb-4 text-center">
              <h3 className="font-semibold mb-1">
                {qrAction === 'transfer' ? 'QR Code pour transfert' : 'QR Code pour paiement'}
              </h3>
              <p className="text-sm text-gray-500">
                {qrAction === 'transfer' 
                  ? 'Partagez ce QR code pour recevoir de l\'argent' 
                  : `Pour recevoir ${amount} XAF`}
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg border shadow-md">
              <div className="flex items-center justify-center w-56 h-56 bg-gray-100 rounded-lg">
                <QrCode className="w-40 h-40 text-emerald-600" />
                <div className="absolute bg-white rounded-full p-2">
                  <img src="/sendflow-logo.png" alt="Logo" className="w-10 h-10" />
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Contenu: {generateQRData()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QRCodeGenerator;
