
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import WithdrawalNotificationBell from "@/components/notifications/WithdrawalNotificationBell";
import AutomaticWithdrawalConfirmation from "@/components/withdrawal/AutomaticWithdrawalConfirmation";
import { useWithdrawalConfirmations } from "@/hooks/useWithdrawalConfirmations";

const MobileRecharge = () => {
  const { isAgent } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [operator, setOperator] = useState("");
  const { toast } = useToast();
  
  // Utiliser le hook de confirmation de retrait
  const {
    pendingWithdrawals,
    selectedWithdrawal,
    showConfirmation,
    handleNotificationClick,
    handleConfirm,
    handleReject,
    closeConfirmation
  } = useWithdrawalConfirmations();
  
  const operators = [
    { id: "orange", name: "Orange", logo: "🟠" },
    { id: "mtn", name: "MTN", logo: "🟡" },
    { id: "nexttel", name: "Nexttel", logo: "🟤" },
    { id: "camtel", name: "CAMTEL", logo: "🔵" },
  ];
  
  const amounts = ["500", "1000", "2000", "5000", "10000"];
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!phoneNumber || !amount || !operator) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "Recharge en cours",
      description: `Traitement de votre demande de recharge de ${amount} XAF pour le ${phoneNumber}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-8 px-4">
      <div className="container max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
          
          {/* Cloche de notification - Only for non-agents */}
          {!isAgent() && (
            <WithdrawalNotificationBell 
              notificationCount={pendingWithdrawals.length}
              onClick={handleNotificationClick}
            />
          )}
        </div>
        
        <h1 className="text-2xl font-bold mb-6">Recharge téléphonique</h1>
        
        {/* Alerte de confirmation de retrait */}
        {pendingWithdrawals.length > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-orange-800">Confirmation de retrait requise</h3>
                  <p className="text-sm text-orange-700">
                    Un agent souhaite effectuer un retrait de {pendingWithdrawals[0]?.amount} FCFA
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    La procédure est en attente de votre confirmation
                  </p>
                </div>
                <Button 
                  onClick={handleNotificationClick}
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  Confirmer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="mr-2 h-5 w-5" />
              Recharger un numéro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Numéro de téléphone
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="Ex: 6XXXXXXXX"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Opérateur</label>
                <div className="grid grid-cols-2 gap-2">
                  {operators.map((op) => (
                    <Button
                      key={op.id}
                      type="button"
                      variant={operator === op.id ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => setOperator(op.id)}
                    >
                      <span className="mr-2">{op.logo}</span> {op.name}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Montant</label>
                <div className="grid grid-cols-3 gap-2">
                  {amounts.map((amt) => (
                    <Button
                      key={amt}
                      type="button"
                      variant={amount === amt ? "default" : "outline"}
                      onClick={() => setAmount(amt)}
                    >
                      {amt} XAF
                    </Button>
                  ))}
                  <div className="col-span-3">
                    <div className="relative mt-2">
                      <input
                        type="number"
                        value={!amounts.includes(amount) ? amount : ""}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full p-2 pl-16 border rounded-md"
                        placeholder="Autre montant"
                      />
                      <span className="absolute left-3 top-2 text-gray-500">
                        Autre:
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Frais de service: 1.5%
                </p>
              </div>
              
              <Button type="submit" className="w-full">
                Recharger maintenant
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Cartes cadeaux</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-20 flex flex-col">
                <span className="text-2xl">🎮</span>
                <span className="text-sm">Gaming</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col">
                <span className="text-2xl">🛒</span>
                <span className="text-sm">Shopping</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col">
                <span className="text-2xl">🎬</span>
                <span className="text-sm">Streaming</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col">
                <span className="text-2xl">🎵</span>
                <span className="text-sm">Musique</span>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Modal de confirmation de retrait automatique */}
        {showConfirmation && selectedWithdrawal && (
          <AutomaticWithdrawalConfirmation 
            withdrawal={selectedWithdrawal}
            onConfirm={handleConfirm}
            onReject={handleReject}
            onClose={closeConfirmation}
          />
        )}
      </div>
    </div>
  );
};

export default MobileRecharge;
