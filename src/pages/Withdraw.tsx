
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import QRCodeGenerator from "@/components/QRCodeGenerator";

const Withdraw = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [withdrawalId, setWithdrawalId] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.id) {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('country, phone, full_name')
          .eq('id', user.id)
          .single();
        
        if (!error && data) {
          const userCountry = data.country || "Congo Brazzaville";
          setCountry(userCountry);
          setPhoneNumber(data.phone || "");
          setFullName(data.full_name || "");
          
          const selectedCountry = countries.find(c => c.name === userCountry);
          if (selectedCountry) {
            setCountryCode(selectedCountry.code);
          }
        }
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast({
        title: "Montant invalide",
        description: "Veuillez entrer un montant valide",
        variant: "destructive"
      });
      return;
    }

    if (!phoneNumber) {
      toast({
        title: "Numéro de téléphone requis",
        description: "Veuillez entrer un numéro de téléphone pour le retrait",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);

      if (!user?.id) {
        throw new Error("Utilisateur non connecté");
      }

      const formattedPhone = phoneNumber.startsWith('+') 
        ? phoneNumber 
        : `${countryCode}${phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber}`;

      // Process the withdrawal in Supabase
      const { data: withdrawal, error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user.id,
          amount: Number(amount),
          withdrawal_phone: formattedPhone,
          status: 'pending'
        })
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      // Update user balance
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();
      
      if (profileError || !profile) {
        throw new Error("Impossible de vérifier votre solde");
      }
      
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ balance: profile.balance - Number(amount) })
        .eq('id', user.id);
      
      if (balanceError) {
        throw new Error("Erreur lors de la mise à jour du solde");
      }

      // Set withdrawal ID for QR code generation
      setWithdrawalId(withdrawal.id);
      setShowQRCode(true);

    } catch (error) {
      console.error("Erreur lors du retrait:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors du retrait",
        variant: "destructive"
      });
      setIsProcessing(false);
    }
  };

  // QR code data for withdrawal
  const generateWithdrawalQRData = () => {
    if (!withdrawalId || !user) return '';
    
    const qrData = {
      action: 'withdraw',
      withdrawalId: withdrawalId,
      amount: amount,
      userId: user.id,
      phone: phoneNumber
    };
    
    return JSON.stringify(qrData);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-4 px-0">
      <div className="max-w-md mx-auto space-y-4">
        <div className="flex items-center justify-between px-4 mb-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')}
            className="text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Retrait d'argent</h1>
          <div className="w-9"></div>
        </div>

        <Card className="mx-4">
          <CardHeader>
            <CardTitle className="text-lg">Demande de retrait</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    readOnly
                    className="bg-gray-100"
                  />
                </div>
              
                <div className="space-y-2">
                  <Label htmlFor="amount">Montant (XAF)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Entrez le montant"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">Pays</Label>
                  <Input
                    id="country"
                    type="text"
                    value={country}
                    readOnly
                    className="bg-gray-100"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Numéro de téléphone</Label>
                  <div className="flex items-center space-x-2">
                    <div className="bg-gray-100 px-3 py-2 rounded-md border border-input text-sm">
                      {countryCode}
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      className="flex-1 bg-gray-100"
                      value={phoneNumber}
                      readOnly
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Traitement en cours..." : "Confirmer le retrait"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Retrait par QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4 space-y-4">
            <p className="text-center text-sm text-gray-600">
              Montrez ce QR code pour retirer vos {amount} XAF.
              Le retrait sera confirmé après scan du code.
            </p>
            
            <div className="bg-white p-5 rounded-lg shadow-md">
              {withdrawalId && (
                <QRCodeSVG 
                  value={generateWithdrawalQRData()} 
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              )}
            </div>
            
            <Button 
              onClick={() => {
                setShowQRCode(false);
                navigate('/');
              }}
              className="w-full mt-4"
            >
              Terminer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Withdraw;

// Import countries from data and QR code
import { countries } from "@/data/countries";
import { QRCodeSVG } from "qrcode.react";
