import { useState } from "react";
import { ArrowLeft, Zap, Wifi, Tv, Droplets } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const BillPayments = () => {
  const navigate = useNavigate();
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [provider, setProvider] = useState("");

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
            <CardTitle className="text-center text-lg text-gray-700">
              Sélectionnez un service
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="electricity" className="w-full">
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
                    {/* Provider Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="provider" className="text-sm font-medium text-gray-700">
                        Fournisseur
                      </Label>
                      <Select value={provider} onValueChange={setProvider}>
                        <SelectTrigger className="w-full h-12 bg-gray-50 border-gray-200 rounded-xl">
                          <SelectValue placeholder="Choisir un fournisseur" />
                        </SelectTrigger>
                        <SelectContent>
                          {providers[service.id as keyof typeof providers]?.map((prov) => (
                            <SelectItem key={prov} value={prov}>
                              {prov}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Account Number */}
                    <div className="space-y-2">
                      <Label htmlFor="account" className="text-sm font-medium text-gray-700">
                        Numéro de compte
                      </Label>
                      <Input
                        id="account"
                        type="text"
                        placeholder="Entrez votre numéro de compte"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="h-12 bg-gray-50 border-gray-200 rounded-xl"
                      />
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