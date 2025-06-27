
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/ui/icons";

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
    <div className="min-h-screen bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-blue-600">
            Connexion Agent
          </CardTitle>
          <CardDescription className="text-center">
            Connectez-vous à votre espace agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loginPhone">Numéro de téléphone</Label>
              <Input
                id="loginPhone"
                type="text"
                placeholder="Exemple: +242061043340 ou +221773637752"
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                required
                className="w-full"
                disabled={loading}
              />
              <p className="text-xs text-blue-600">
                💡 Utilisez le format complet avec le code pays (ex: +242...)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loginPassword">Mot de passe</Label>
              <Input
                id="loginPassword"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="w-full"
                disabled={loading}
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              {loading ? "Chargement..." : "Se connecter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentAuthForm;
