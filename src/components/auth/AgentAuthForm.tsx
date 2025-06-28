
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/ui/icons";
import { Shield, Users } from "lucide-react";

const AgentAuthForm = () => {
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Fonction pour normaliser les numéros de téléphone
  const normalizePhoneNumber = (phoneInput: string) => {
    // Supprimer tous les espaces et caractères non numériques sauf le +
    let cleanPhone = phoneInput.replace(/[^\d+]/g, '');
    
    console.log('📱 Numéro normalisé:', cleanPhone, 'depuis:', phoneInput);
    return cleanPhone;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Connexion - normaliser le numéro de téléphone
      if (!loginPhone || !loginPassword) {
        throw new Error("Veuillez remplir tous les champs");
      }

      // Normaliser le numéro pour la connexion
      const normalizedLoginPhone = normalizePhoneNumber(loginPhone);

      console.log('🏢 Tentative de connexion AGENT:', {
        original: loginPhone,
        normalized: normalizedLoginPhone
      });

      await signIn(normalizedLoginPhone, loginPassword);
      toast.success("Connexion agent réussie! Redirection en cours...");
      console.log('✅ Connexion agent réussie avec numéro:', normalizedLoginPhone);
    } catch (error: any) {
      console.error("Erreur d'authentification agent:", error);
      
      let errorMessage = "Une erreur est survenue";
      
      if (error.message.includes("Numéro de téléphone ou mot de passe incorrect") || 
          error.message.includes("Invalid login credentials")) {
        errorMessage = "Numéro de téléphone ou mot de passe incorrect. Assurez-vous d'utiliser le même format de numéro qu'à l'inscription (avec le code pays).";
      } else if (error.message.includes("Password should be at least 6 characters")) {
        errorMessage = "Le mot de passe doit contenir au moins 6 caractères";
      } else {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-indigo-600/20 to-purple-700/20"></div>
      <div className="absolute top-1/3 left-1/3 w-40 h-40 bg-white/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-1/3 right-1/3 w-56 h-56 bg-white/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
      
      <Card className="w-full max-w-md backdrop-blur-sm bg-white/95 shadow-2xl border-0 animate-fade-in">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4 animate-scale-in shadow-lg">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Espace Agent
          </CardTitle>
          <CardDescription className="text-gray-600 text-lg flex items-center justify-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Accès professionnel sécurisé
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="loginPhone" className="text-gray-700 font-medium">Numéro de téléphone</Label>
              <Input
                id="loginPhone"
                type="text"
                placeholder="Exemple: +242061043340 ou +221773637752"
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                required
                className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                disabled={loading}
              />
              <p className="text-xs text-blue-600 flex items-center gap-1">
                💡 Utilisez le format complet avec le code pays (ex: +242...)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loginPassword" className="text-gray-700 font-medium">Mot de passe</Label>
              <Input
                id="loginPassword"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="h-12 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                disabled={loading}
                minLength={6}
                placeholder="Votre mot de passe sécurisé"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              disabled={loading}
            >
              {loading && (
                <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />
              )}
              {loading ? "Connexion en cours..." : "Se connecter"}
            </Button>

            <div className="text-center pt-4">
              <p className="text-sm text-gray-500">
                Accès réservé aux agents autorisés uniquement
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentAuthForm;
