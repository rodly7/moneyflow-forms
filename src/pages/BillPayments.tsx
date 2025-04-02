
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Zap, Wifi, Tv, Droplet } from "lucide-react";
import { Link } from "react-router-dom";

const BillPayments = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-8 px-4">
      <div className="container max-w-lg mx-auto">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>
        
        <h1 className="text-2xl font-bold mb-6">Paiement de factures</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Choisissez un service</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="electricity" className="w-full">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="electricity">
                  <Zap className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Électricité</span>
                </TabsTrigger>
                <TabsTrigger value="internet">
                  <Wifi className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Internet</span>
                </TabsTrigger>
                <TabsTrigger value="tv">
                  <Tv className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">TV</span>
                </TabsTrigger>
                <TabsTrigger value="water">
                  <Droplet className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Eau</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="electricity" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="account-num" className="text-sm font-medium">
                      Numéro de compte
                    </label>
                    <input
                      id="account-num"
                      type="text"
                      className="border rounded-md px-3 py-2"
                      placeholder="Entrez votre numéro de compte"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <label htmlFor="payment-amount" className="text-sm font-medium">
                      Montant à payer
                    </label>
                    <div className="relative">
                      <input
                        id="payment-amount"
                        type="number"
                        className="border rounded-md px-3 py-2 w-full pl-10"
                        placeholder="0"
                      />
                      <span className="absolute left-3 top-2.5 text-gray-500">XAF</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Frais de traitement: 2.5%
                    </p>
                  </div>
                  
                  <Button className="w-full mt-2">Vérifier les détails</Button>
                </div>
              </TabsContent>
              
              <TabsContent value="internet" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="provider" className="text-sm font-medium">
                      Fournisseur
                    </label>
                    <select
                      id="provider"
                      className="border rounded-md px-3 py-2"
                    >
                      <option value="">Sélectionnez un fournisseur</option>
                      <option value="orange">Orange</option>
                      <option value="mtn">MTN</option>
                      <option value="camtel">CAMTEL</option>
                    </select>
                  </div>
                  
                  <div className="grid gap-2">
                    <label htmlFor="internet-id" className="text-sm font-medium">
                      Identifiant client
                    </label>
                    <input
                      id="internet-id"
                      type="text"
                      className="border rounded-md px-3 py-2"
                      placeholder="Entrez votre identifiant"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <label htmlFor="internet-amount" className="text-sm font-medium">
                      Montant à payer
                    </label>
                    <div className="relative">
                      <input
                        id="internet-amount"
                        type="number"
                        className="border rounded-md px-3 py-2 w-full pl-10"
                        placeholder="0"
                      />
                      <span className="absolute left-3 top-2.5 text-gray-500">XAF</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Frais de traitement: 2.5%
                    </p>
                  </div>
                  
                  <Button className="w-full mt-2">Vérifier les détails</Button>
                </div>
              </TabsContent>
              
              <TabsContent value="tv">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="tv-provider" className="text-sm font-medium">
                      Opérateur
                    </label>
                    <select
                      id="tv-provider"
                      className="border rounded-md px-3 py-2"
                    >
                      <option value="">Sélectionnez un opérateur</option>
                      <option value="canal+">Canal+</option>
                      <option value="startimes">StarTimes</option>
                    </select>
                  </div>
                  
                  <div className="grid gap-2">
                    <label htmlFor="decoder-num" className="text-sm font-medium">
                      Numéro décodeur
                    </label>
                    <input
                      id="decoder-num"
                      type="text"
                      className="border rounded-md px-3 py-2"
                      placeholder="Entrez le numéro de décodeur"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <label htmlFor="package" className="text-sm font-medium">
                      Forfait
                    </label>
                    <select
                      id="package"
                      className="border rounded-md px-3 py-2"
                    >
                      <option value="">Sélectionnez un forfait</option>
                      <option value="access">Access</option>
                      <option value="family">Family</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                  
                  <Button className="w-full mt-2">Vérifier les détails</Button>
                </div>
              </TabsContent>
              
              <TabsContent value="water">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="water-account" className="text-sm font-medium">
                      Numéro de contrat
                    </label>
                    <input
                      id="water-account"
                      type="text"
                      className="border rounded-md px-3 py-2"
                      placeholder="Entrez votre numéro de contrat"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <label htmlFor="water-amount" className="text-sm font-medium">
                      Montant à payer
                    </label>
                    <div className="relative">
                      <input
                        id="water-amount"
                        type="number"
                        className="border rounded-md px-3 py-2 w-full pl-10"
                        placeholder="0"
                      />
                      <span className="absolute left-3 top-2.5 text-gray-500">XAF</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Frais de traitement: 2.5%
                    </p>
                  </div>
                  
                  <Button className="w-full mt-2">Vérifier les détails</Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BillPayments;
