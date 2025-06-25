
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Banknote, AlertCircle, Loader2, Search, User, Shield, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { findUserByPhone } from "@/services/withdrawalService";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ClientData {
  id: string;
  full_name: string;
  phone: string;
  country?: string;
}

export const SecureAgentWithdrawalForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [isSearchingClient, setIsSearchingClient] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showClientInfo, setShowClientInfo] = useState(false);

  const searchClientByPhone = async (phone: string) => {
    if (!phone || phone.length < 6) {
      setClientData(null);
      return;
    }

    setIsSearchingClient(true);
    try {
      console.log("🔍 Recherche client sécurisée:", phone);
      
      const client = await findUserByPhone(phone);
      
      if (client) {
        // Ne pas exposer le solde du client à l'agent
        setClientData({
          id: client.id,
          full_name: client.full_name,
          phone: client.phone,
          country: client.country
        });
        console.log("✅ Client trouvé (données sécurisées)");
        
        toast({
          title: "Client trouvé",
          description: `${client.full_name || 'Utilisateur'} identifié avec succès`,
        });
      } else {
        setClientData(null);
        toast({
          title: "Client non trouvé",
          description: "Aucun utilisateur trouvé avec ce numéro",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("❌ Erreur recherche:", error);
      setClientData(null);
      toast({
        title: "Erreur de recherche",
        description: "Impossible de rechercher le client",
        variant: "destructive"
      });
    }
    setIsSearchingClient(false);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneNumber(value);
    
    // Réinitialiser les données client quand le numéro change
    if (clientData) {
      setClientData(null);
    }
  };

  const handleSearch = () => {
    if (phoneNumber) {
      searchClientByPhone(phoneNumber);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !phoneNumber || !clientData) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }
    
    const withdrawalAmount = Number(amount);
    
    if (withdrawalAmount <= 0) {
      toast({
        title: "Montant invalide",
        description: "Le montant doit être supérieur à 0",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);

    try {
      // Créer une demande de retrait sécurisée
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: clientData.id,
          agent_id: user?.id,
          agent_name: user?.user_metadata?.full_name || 'Agent',
          agent_phone: user?.phone || phoneNumber,
          amount: withdrawalAmount,
          withdrawal_phone: phoneNumber,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast({
        title: "Demande de retrait créée",
        description: `Demande de ${withdrawalAmount.toLocaleString()} FCFA envoyée au client pour confirmation sécurisée`,
      });

      // Reset form
      setAmount("");
      setPhoneNumber("");
      setClientData(null);
      
    } catch (error) {
      console.error("❌ Erreur lors de la demande:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer la demande de retrait",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          Retrait Sécurisé Client
        </CardTitle>
        <p className="text-sm text-gray-600">
          Le client devra confirmer avec son mot de passe ou Face ID
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recherche du client */}
          <div className="space-y-2">
            <Label htmlFor="phone">Numéro du client</Label>
            <div className="flex gap-2">
              <Input
                id="phone"
                type="tel"
                placeholder="Entrez le numéro du client"
                value={phoneNumber}
                onChange={handlePhoneChange}
                required
                className="h-12"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSearch}
                disabled={isSearchingClient || !phoneNumber}
                className="h-12 px-3"
              >
                {isSearchingClient ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Affichage sécurisé des informations du client */}
          {clientData && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-blue-800">
                  <User className="w-4 h-4 mr-2" />
                  <span className="font-medium">
                    {showClientInfo ? clientData.full_name || 'Nom non disponible' : '••••••••'}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowClientInfo(!showClientInfo)}
                  className="h-6 w-6 p-0"
                >
                  {showClientInfo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <div className="text-sm text-blue-600">
                Pays: {showClientInfo ? (clientData.country || 'Non spécifié') : '••••••••'}
              </div>
              <div className="text-xs text-blue-500 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Solde masqué pour la sécurité
              </div>
            </div>
          )}

          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="amount">Montant du retrait (FCFA)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Entrez le montant à retirer"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="h-12 text-lg"
              disabled={!clientData}
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <div className="flex items-start gap-2">
              <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Retrait sécurisé</p>
                <ul className="text-xs space-y-1">
                  <li>• Le client recevra une notification de confirmation</li>
                  <li>• Il devra s'authentifier avec son mot de passe ou Face ID</li>
                  <li>• Le retrait ne sera effectué qu'après sa confirmation</li>
                  <li>• Vous serez notifié du résultat</li>
                </ul>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
            disabled={isProcessing || !clientData || !amount}
          >
            {isProcessing ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>Création de la demande...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Shield className="mr-2 h-5 w-5" />
                <span>Créer une demande sécurisée</span>
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
