import { useState, useEffect } from "react";
import { ArrowLeft, Zap, Wifi, Tv, Droplets } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

const BillPayments = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [provider, setProvider] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedService, setSelectedService] = useState("electricity");
  const [savedMeterNumbers, setSavedMeterNumbers] = useState<{[key: string]: string}>({});

  const feeRate = 0.015; // 1.5% frais

  // Remplir automatiquement le pays de l'utilisateur
  useEffect(() => {
    if (profile?.country) {
      console.log('User country from profile:', profile.country);
      setSelectedCountry(profile.country);
    }
  }, [profile?.country]);

  // Debug log pour voir les données disponibles
  useEffect(() => {
    console.log('Selected Country:', selectedCountry);
    console.log('Selected Service:', selectedService);
    console.log('Available providers:', (serviceProviders as any)[selectedCountry]?.[selectedService]);
  }, [selectedCountry, selectedService]);

  // Charger les numéros de compteur sauvegardés depuis le localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedMeterNumbers');
    if (saved) {
      setSavedMeterNumbers(JSON.parse(saved));
    }
  }, []);

  // Sauvegarder le numéro de compteur
  const saveMeterNumber = () => {
    if (accountNumber && provider && selectedService) {
      const key = `${selectedCountry}-${selectedService}-${provider}`;
      const newSaved = { ...savedMeterNumbers, [key]: accountNumber };
      setSavedMeterNumbers(newSaved);
      localStorage.setItem('savedMeterNumbers', JSON.stringify(newSaved));
      alert('Numéro de compteur sauvegardé!');
    }
  };

  // Charger un numéro de compteur sauvegardé
  const loadSavedMeterNumber = () => {
    if (provider && selectedService) {
      const key = `${selectedCountry}-${selectedService}-${provider}`;
      const saved = savedMeterNumbers[key];
      if (saved) {
        setAccountNumber(saved);
      }
    }
  };

  const serviceProviders = {
    "Sénégal": {
      electricity: ["SENELEC"],
      water: ["SDE"],
      internet: ["Orange Sénégal", "Free Sénégal", "Expresso"],
      phone: ["Orange Sénégal", "Free Sénégal", "Expresso"],
      tv: ["Canal+ Sénégal", "StarTimes"]
    },
    "Mali": {
      electricity: ["EDM-SA"],
      water: ["SOMAGEP"],
      internet: ["Orange Mali", "Malitel"],
      phone: ["Orange Mali", "Malitel"],
      tv: ["Canal+ Mali", "StarTimes"]
    },
    "Burkina Faso": {
      electricity: ["SONABEL"],
      water: ["ONEA"],
      internet: ["Orange Burkina", "Telmob"],
      phone: ["Orange Burkina", "Telmob"],
      tv: ["Canal+ Burkina", "StarTimes"]
    },
    "Côte d'Ivoire": {
      electricity: ["CIE"],
      water: ["SODECI"],
      internet: ["Orange CI", "MTN CI", "Moov CI"],
      phone: ["Orange CI", "MTN CI", "Moov CI"],
      tv: ["Canal+ CI", "StarTimes"]
    },
    "Niger": {
      electricity: ["NIGELEC"],
      water: ["SNE"],
      internet: ["Orange Niger", "Airtel Niger"],
      phone: ["Orange Niger", "Airtel Niger"],
      tv: ["Canal+ Niger", "StarTimes"]
    },
    "Guinée": {
      electricity: ["EDG"],
      water: ["SEG"],
      internet: ["Orange Guinée", "MTN Guinée"],
      phone: ["Orange Guinée", "MTN Guinée"],
      tv: ["Canal+ Guinée", "StarTimes"]
    },
    "Cameroun": {
      electricity: ["ENEO"],
      water: ["CAMWATER"],
      internet: ["Orange Cameroun", "MTN Cameroun"],
      phone: ["Orange Cameroun", "MTN Cameroun"],
      tv: ["Canal+ Cameroun", "StarTimes"]
    },
    "Togo": {
      electricity: ["CEET"],
      water: ["TdE"],
      internet: ["Togocom", "Moov Togo"],
      phone: ["Togocom", "Moov Togo"],
      tv: ["Canal+ Togo", "StarTimes"]
    },
    "Bénin": {
      electricity: ["SBEE"],
      water: ["SONEB"],
      internet: ["MTN Bénin", "Moov Bénin"],
      phone: ["MTN Bénin", "Moov Bénin"],
      tv: ["Canal+ Bénin", "StarTimes"]
    },
    "Congo Brazzaville": {
      electricity: ["SNE"],
      water: ["LCDE"],
      internet: ["canalbox", "congotelecom"],
      phone: ["MTN Congo", "Airtel Congo"],
      tv: ["Canal+ Congo", "StarTimes"]
    },
    "République démocratique du Congo": {
      electricity: ["SNEL"],
      water: ["REGIDESO"],
      internet: ["Vodacom RDC", "Orange RDC", "Airtel RDC"],
      phone: ["Vodacom RDC", "Orange RDC", "Airtel RDC"],
      tv: ["Canal+ RDC", "StarTimes"]
    },
    "Gabon": {
      electricity: ["SEEG"],
      water: ["SEEG"],
      internet: ["Gabon Telecom", "Airtel Gabon"],
      phone: ["Gabon Telecom", "Airtel Gabon"],
      tv: ["Canal+ Gabon", "StarTimes"]
    },
    "Tchad": {
      electricity: ["SNE"],
      water: ["STE"],
      internet: ["Airtel Tchad", "Tigo Tchad"],
      phone: ["Airtel Tchad", "Tigo Tchad"],
      tv: ["Canal+ Tchad", "StarTimes"]
    },
    "République centrafricaine": {
      electricity: ["ENERCA"],
      water: ["SODECA"],
      internet: ["Orange RCA", "Telecel"],
      phone: ["Orange RCA", "Telecel"],
      tv: ["Canal+ RCA", "StarTimes"]
    }
  };

  const calculateTotal = () => {
    const baseAmount = parseFloat(amount) || 0;
    const fees = baseAmount * feeRate;
    return baseAmount + fees;
  };

  const services = [
    { id: "electricity", label: "Électricité", icon: Zap, color: "from-yellow-500 to-orange-500" },
    { id: "internet", label: "Internet", icon: Wifi, color: "from-blue-500 to-purple-500" },
    { id: "tv", label: "TV", icon: Tv, color: "from-green-500 to-teal-500" },
    { id: "water", label: "Eau", icon: Droplets, color: "from-cyan-500 to-blue-500" }
  ];

  const providers = {
    electricity: ["SENELEC", "EDM Mali", "CIE Côte d'Ivoire", "ENEO Cameroun"],
    internet: ["Orange", "Moov", "MTN", "Airtel"],
    tv: ["Canal+", "StarTimes", "MyTV", "TNT"],
    water: ["SDE", "SODECI", "CAMWATER", "EDM"]
  };

  const handleVerifyDetails = () => {
    if (!accountNumber || !amount || !provider) {
      alert("Veuillez remplir tous les champs");
      return;
    }
    alert(`Détails vérifiés pour ${provider}\nNuméro: ${accountNumber}\nMontant: ${amount} FCFA`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white shadow-md hover:shadow-lg transition-shadow"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">Paiement de Factures</h1>
        </div>

        {/* Services Tabs */}
        <Card className="bg-white shadow-xl rounded-3xl border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-lg text-gray-700 mb-2">
              Choisissez la facture à payer :
            </CardTitle>
            <p className="text-center text-sm text-gray-600">
              (Électricité, Eau, Wi-Fi, TV…)
            </p>
            <p className="text-center text-xs text-blue-600 mt-2">
              Nous vous afficherons automatiquement les entreprises disponibles selon votre pays.
            </p>
          </CardHeader>
          <CardContent>
            {/* Country Selection - Rempli automatiquement */}
            <div className="space-y-2 mb-4">
              <Label className="text-sm font-medium text-gray-700">Pays</Label>
              <input 
                type="text" 
                value={selectedCountry} 
                readOnly 
                className="w-full h-12 bg-gray-100 border-gray-200 rounded-xl px-3 text-gray-600 cursor-not-allowed"
                placeholder="Pays de l'utilisateur"
              />
            </div>

            <Tabs value={selectedService} onValueChange={setSelectedService} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6 bg-gray-100 rounded-2xl p-1">
                {services.map((service) => {
                  const IconComponent = service.icon;
                  return (
                    <TabsTrigger
                      key={service.id}
                      value={service.id}
                      className="flex-col gap-1 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl"
                    >
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${service.color}`}>
                        <IconComponent className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-xs font-medium">{service.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {services.map((service) => (
                <TabsContent key={service.id} value={service.id} className="space-y-4">
                  <div className="space-y-4">
                    {/* Provider Selection - Élément HTML natif */}
                    <div className="space-y-2">
                      <Label htmlFor="provider" className="text-sm font-medium text-gray-700">
                        Fournisseur disponible dans votre pays ({selectedCountry})
                      </Label>
                      {(serviceProviders as any)[selectedCountry]?.[service.id]?.length > 0 ? (
                        <select 
                          value={provider} 
                          onChange={(e) => {
                            setProvider(e.target.value);
                            // Charger automatiquement le numéro sauvegardé si disponible
                            setTimeout(loadSavedMeterNumber, 100);
                          }}
                          className="w-full h-12 bg-gray-50 border-gray-200 rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Choisir un fournisseur</option>
                          {(serviceProviders as any)[selectedCountry]?.[service.id]?.map((prov: string) => (
                            <option key={prov} value={prov}>
                              {prov}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="w-full h-12 bg-gray-100 border-gray-200 rounded-xl px-3 flex items-center text-gray-500">
                          Aucun fournisseur disponible pour {service.label} dans votre pays
                        </div>
                      )}
                    </div>

                    {/* Account Number avec sauvegarde */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="account" className="text-sm font-medium text-gray-700">
                          Numéro de compteur
                        </Label>
                        {accountNumber && (
                          <button 
                            onClick={saveMeterNumber}
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            Sauvegarder
                          </button>
                        )}
                      </div>
                      <Input
                        id="account"
                        type="text"
                        placeholder="Entrez votre numéro de compteur"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="h-12 bg-gray-50 border-gray-200 rounded-xl"
                      />
                      {provider && selectedService && savedMeterNumbers[`${selectedCountry}-${selectedService}-${provider}`] && (
                        <div className="text-xs text-gray-500">
                          Numéro sauvegardé disponible
                        </div>
                      )}
                    </div>

                     {/* Amount */}
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
                        Montant (FCFA)
                      </Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="h-12 bg-gray-50 border-gray-200 rounded-xl"
                      />
                      {amount && (
                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                          <div className="flex justify-between items-center">
                            <span>Montant de base:</span>
                            <span>{parseFloat(amount || "0").toLocaleString()} FCFA</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>Frais (1,5%):</span>
                            <span>{(parseFloat(amount || "0") * feeRate).toLocaleString()} FCFA</span>
                          </div>
                          <div className="flex justify-between items-center font-semibold text-primary border-t pt-2 mt-2">
                            <span>Total à payer:</span>
                            <span>{calculateTotal().toLocaleString()} FCFA</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Verify Button */}
                    <Button
                      onClick={handleVerifyDetails}
                      className={`w-full h-12 rounded-xl bg-gradient-to-r ${service.color} hover:opacity-90 transition-opacity text-white font-medium shadow-lg`}
                    >
                      Vérifier les détails
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Amount Buttons */}
        <div className="mt-6">
          <Label className="text-sm font-medium text-gray-700 mb-3 block">
            Montants rapides
          </Label>
          <div className="grid grid-cols-3 gap-3">
            {[5000, 10000, 25000].map((quickAmount) => (
              <Button
                key={quickAmount}
                variant="outline"
                onClick={() => setAmount(quickAmount.toString())}
                className="h-12 rounded-xl bg-white border-gray-200 hover:bg-gray-50 transition-colors"
              >
                {quickAmount.toLocaleString()} F
              </Button>
            ))}
          </div>
        </div>

        {/* Tips */}
        <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-blue-100 rounded-full flex-shrink-0">
                <Zap className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Conseils utiles :</p>
                <ul className="space-y-1 text-xs">
                  <li>• Vérifiez toujours votre numéro de compte</li>
                  <li>• Les paiements sont traités instantanément</li>
                  <li>• Gardez votre reçu pour vos archives</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BillPayments;