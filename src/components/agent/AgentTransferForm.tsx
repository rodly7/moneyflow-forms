
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, User, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useUserSearch } from "@/hooks/useUserSearch";
import { useTransferOperations } from "@/hooks/useTransferOperations";
import { countries } from "@/data/countries";
import { calculateFee, formatCurrency } from "@/integrations/supabase/client";

export const AgentTransferForm = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { searchUserByPhone } = useUserSearch();
  const { processTransfer, isLoading } = useTransferOperations();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [recipientData, setRecipientData] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [amount, setAmount] = useState("");
  const [recipientCountry, setRecipientCountry] = useState("");
  const [recipientName, setRecipientName] = useState("");

  const userCountry = profile?.country || "Cameroun";

  // Recherche automatique du destinataire
  const searchRecipientAutomatically = async (phone: string) => {
    if (!phone || phone.length < 6) {
      setRecipientData(null);
      return;
    }

    setIsSearching(true);
    try {
      console.log("🔍 Recherche automatique du destinataire:", phone);
      const recipient = await searchUserByPhone(phone);
      
      if (recipient) {
        // Masquer les informations sensibles pour l'agent
        const secureRecipientData = {
          id: recipient.id,
          full_name: recipient.full_name,
          phone: recipient.phone,
          country: recipient.country,
          // Ne pas exposer le solde
        };
        setRecipientData(secureRecipientData);
        setRecipientCountry(recipient.country || "");
        setRecipientName(recipient.full_name || "");
        console.log("✅ Destinataire trouvé (informations masquées):", secureRecipientData);
      } else {
        setRecipientData(null);
        setRecipientCountry("");
        setRecipientName("");
      }
    } catch (error) {
      console.error("❌ Erreur lors de la recherche automatique:", error);
      setRecipientData(null);
    }
    setIsSearching(false);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneNumber(value);
    
    // Réinitialiser les données si le numéro change
    if (recipientData) {
      setRecipientData(null);
      setRecipientCountry("");
      setRecipientName("");
    }

    // Recherche automatique quand le numéro semble complet
    if (value.length >= 8) {
      searchRecipientAutomatically(value);
    }
  };

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

    if (!recipientCountry) {
      toast({
        title: "Pays requis",
        description: "Veuillez sélectionner le pays de destination",
        variant: "destructive"
      });
      return;
    }

    // Vérifier que les agents ne peuvent faire que des transferts internationaux
    if (userCountry === recipientCountry) {
      toast({
        title: "Transfert non autorisé",
        description: "En tant qu'agent, vous ne pouvez effectuer que des transferts internationaux",
        variant: "destructive"
      });
      return;
    }

    const transferData = {
      amount: Number(amount),
      recipient: {
        email: recipientData?.email || phoneNumber + "@placeholder.com",
        fullName: recipientName || "Destinataire",
        country: recipientCountry,
        phone: phoneNumber
      }
    };

    const result = await processTransfer(transferData);
    
    if (result.success) {
      // Reset du formulaire
      setPhoneNumber("");
      setAmount("");
      setRecipientData(null);
      setRecipientCountry("");
      setRecipientName("");
    }
  };

  // Calculer les frais
  const transferAmount = Number(amount) || 0;
  const { fee: fees, rate } = calculateFee(transferAmount, userCountry, recipientCountry, 'agent');
  const total = transferAmount + fees;
  const isInternational = userCountry !== recipientCountry;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-600">
          <ArrowRight className="w-5 h-5" />
          Transfert International
        </CardTitle>
        <p className="text-sm text-gray-600">
          Effectuez des transferts d'argent internationaux pour vos clients
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recherche du destinataire */}
          <div className="space-y-2">
            <Label htmlFor="phone">Numéro du destinataire</Label>
            <div className="relative">
              <Input
                id="phone"
                type="tel"
                placeholder="Entrez le numéro du destinataire"
                value={phoneNumber}
                onChange={handlePhoneChange}
                required
                className="h-12"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
          </div>

          {/* Informations du destinataire trouvé */}
          {recipientData && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md space-y-2">
              <div className="flex items-center text-green-800">
                <User className="w-4 h-4 mr-2" />
                <span className="font-medium">{recipientData.full_name || 'Nom non disponible'}</span>
              </div>
              <div className="text-sm text-green-600">
                Pays: {recipientData.country || 'Non spécifié'}
              </div>
              <div className="text-xs text-green-500 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Informations vérifiées
              </div>
            </div>
          )}

          {/* Destinataire non trouvé - saisie manuelle */}
          {phoneNumber.length >= 8 && !recipientData && !isSearching && (
            <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-700 text-sm font-medium">
                Destinataire non trouvé. Veuillez saisir les informations manuellement.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="recipientName">Nom complet du destinataire</Label>
                <Input
                  id="recipientName"
                  type="text"
                  placeholder="Nom complet"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* Sélection du pays de destination */}
          <div className="space-y-2">
            <Label htmlFor="country">Pays de destination</Label>
            <Select value={recipientCountry} onValueChange={setRecipientCountry} required>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez le pays" />
              </SelectTrigger>
              <SelectContent>
                {countries
                  .filter(country => country.name !== userCountry) // Exclure le pays de l'agent
                  .map((country) => (
                    <SelectItem key={country.name} value={country.name}>
                      {country.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-blue-600">
              Note: Seuls les transferts internationaux sont autorisés pour les agents
            </p>
          </div>

          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="amount">Montant à transférer (XAF)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Entrez le montant"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="h-12 text-lg"
              min="100"
              step="100"
            />
          </div>

          {/* Résumé des frais */}
          {transferAmount > 0 && recipientCountry && isInternational && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Montant:</span>
                  <span className="font-medium">{formatCurrency(transferAmount, 'XAF')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frais ({rate}% - International):</span>
                  <span className="font-medium text-blue-600">{formatCurrency(fees, 'XAF')}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total à débiter:</span>
                  <span>{formatCurrency(total, 'XAF')}</span>
                </div>
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
            disabled={isLoading || !phoneNumber || !amount || !recipientCountry || (phoneNumber.length >= 8 && !recipientData && !recipientName)}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                <span>Traitement en cours...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <ArrowRight className="mr-2 h-5 w-5" />
                <span>Effectuer le transfert</span>
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
