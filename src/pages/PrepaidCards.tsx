
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const PrepaidCards = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-8 px-4">
      <div className="container max-w-lg mx-auto">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>
        
        <h1 className="text-2xl font-bold mb-6">Cartes prépayées Money Flow</h1>
        
        <div className="grid grid-cols-1 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Carte Virtuelle</CardTitle>
              <CardDescription>
                Utilisez votre solde pour des achats en ligne en toute sécurité
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Créez instantanément une carte virtuelle liée à votre compte Money Flow.
                Idéale pour les achats en ligne, les abonnements et les services numériques.
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Demander une carte virtuelle</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Carte Physique</CardTitle>
              <CardDescription>
                Accédez à votre argent partout dans le monde
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Recevez une carte physique à votre adresse pour accéder à votre 
                solde Money Flow dans les commerces et aux distributeurs automatiques.
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Commander une carte physique</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Avantages des cartes Money Flow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-start">
                <div className="bg-emerald-100 p-1 rounded-full mr-2">
                  <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm">Frais réduits sur les transactions internationales</p>
              </div>

              <div className="flex items-start">
                <div className="bg-emerald-100 p-1 rounded-full mr-2">
                  <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm">Utilisation immédiate de votre solde après réception de fonds</p>
              </div>

              <div className="flex items-start">
                <div className="bg-emerald-100 p-1 rounded-full mr-2">
                  <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm">Sécurité renforcée avec des notifications instantanées</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PrepaidCards;
