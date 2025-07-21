import { useState } from 'react';
import { Camera, X, User, Phone, Hash } from 'lucide-react';

interface SimpleQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (userData: { userId: string; fullName: string; phone: string }) => void;
  title?: string;
}

const SimpleQRScanner = ({ isOpen, onClose, onScanSuccess, title = "Scanner QR Code" }: SimpleQRScannerProps) => {
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualData, setManualData] = useState({
    userId: '',
    fullName: '',
    phone: ''
  });

  const handleManualSubmit = () => {
    if (!manualData.userId || !manualData.fullName || !manualData.phone) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    onScanSuccess({
      userId: manualData.userId,
      fullName: manualData.fullName,
      phone: manualData.phone
    });
    
    handleClose();
  };

  const handleClose = () => {
    setShowManualInput(false);
    setManualData({ userId: '', fullName: '', phone: '' });
    onClose();
  };

  const simulateQRScan = () => {
    const testData = {
      userId: 'dda64997-5dbd-4a5f-b049-cd68ed31fe40',
      fullName: 'Laureat NGANGOUE',
      phone: '+242065224790'
    };
    
    onScanSuccess(testData);
    handleClose();
  };

  const fillTestData = () => {
    setManualData({
      userId: 'dda64997-5dbd-4a5f-b049-cd68ed31fe40',
      fullName: 'Laureat NGANGOUE',
      phone: '+242065224790'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        {!showManualInput ? (
          <div className="space-y-4">
            {/* Zone d'information */}
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <Camera size={48} className="mx-auto mb-3 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Scanner QR Code</h3>
              <p className="text-gray-600 text-sm mb-4">
                Pour effectuer un paiement rapide, scannez le QR code du destinataire ou saisissez les informations manuellement.
              </p>
            </div>
            
            {/* Boutons d'action */}
            <div className="space-y-3">
              <button
                onClick={simulateQRScan}
                className="w-full bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 flex items-center justify-center gap-2 font-medium"
              >
                <User size={20} />
                Utiliser données de test
              </button>
              
              <button
                onClick={() => setShowManualInput(true)}
                className="w-full border border-gray-300 py-3 px-4 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2 font-medium"
              >
                <Phone size={20} />
                Saisie manuelle
              </button>
            </div>

            {/* Information */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 <strong>Astuce :</strong> Utilisez les données de test pour tester rapidement le système de paiement.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User size={20} className="text-gray-600" />
              <h3 className="text-lg font-medium">Informations du destinataire</h3>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                <User size={16} className="inline mr-1" />
                Nom complet
              </label>
              <input
                type="text"
                value={manualData.fullName}
                onChange={(e) => setManualData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Nom du destinataire"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                <Phone size={16} className="inline mr-1" />
                Téléphone
              </label>
              <input
                type="text"
                value={manualData.phone}
                onChange={(e) => setManualData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+242..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                <Hash size={16} className="inline mr-1" />
                ID Utilisateur
              </label>
              <input
                type="text"
                value={manualData.userId}
                onChange={(e) => setManualData(prev => ({ ...prev, userId: e.target.value }))}
                placeholder="ID du destinataire"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Bouton pour remplir automatiquement */}
            <button
              onClick={fillTestData}
              className="w-full bg-blue-100 text-blue-700 py-2 px-4 rounded-md hover:bg-blue-200 text-sm font-medium"
            >
              📋 Remplir avec données de test
            </button>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleManualSubmit}
                className="flex-1 bg-green-500 text-white py-3 px-4 rounded-md hover:bg-green-600 font-medium"
              >
                ✅ Confirmer
              </button>
              <button
                onClick={() => setShowManualInput(false)}
                className="flex-1 border border-gray-300 py-3 px-4 rounded-md hover:bg-gray-50 font-medium"
              >
                ← Retour
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleQRScanner;