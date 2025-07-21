import { useState } from 'react';

interface SimplePWAQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (userData: { userId: string; fullName: string; phone: string }) => void;
  title?: string;
}

const SimplePWAQRScanner = ({ isOpen, onClose, onScanSuccess, title = "Données du destinataire" }: SimplePWAQRScannerProps) => {
  const [manualData, setManualData] = useState({
    userId: '',
    fullName: '',
    phone: ''
  });

  const handleSubmit = () => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-auto shadow-2xl border-2 border-blue-200">
        <h2 className="text-xl font-bold text-center mb-6">{title}</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nom complet</label>
            <input
              type="text"
              value={manualData.fullName}
              onChange={(e) => setManualData(prev => ({ ...prev, fullName: e.target.value }))}
              placeholder="Nom du destinataire"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Téléphone</label>
            <input
              type="text"
              value={manualData.phone}
              onChange={(e) => setManualData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+221..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">ID Utilisateur</label>
            <input
              type="text"
              value={manualData.userId}
              onChange={(e) => setManualData(prev => ({ ...prev, userId: e.target.value }))}
              placeholder="ID du destinataire"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-600 mb-2">💡 Pour tester rapidement :</p>
            <button
              onClick={simulateQRScan}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 text-sm"
            >
              Utiliser données de test
            </button>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-green-500 text-white py-3 px-4 rounded-md hover:bg-green-600 font-medium"
            >
              Confirmer
            </button>
            <button
              onClick={handleClose}
              className="flex-1 border border-gray-300 py-3 px-4 rounded-md hover:bg-gray-50 font-medium"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplePWAQRScanner;