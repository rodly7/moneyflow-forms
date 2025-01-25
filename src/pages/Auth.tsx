import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/ui/icons";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Login fields
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  
  // Additional signup fields
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [idPhoto, setIdPhoto] = useState<File | null>(null);
  const [email, setEmail] = useState("");
  
  const { signIn, signUp } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIdPhoto(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up process
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          phone,
        });

        if (signUpError) throw signUpError;

        if (authData.user) {
          // Upload ID photo if provided
          let photoUrl = null;
          if (idPhoto) {
            const fileExt = idPhoto.name.split('.').pop();
            const fileName = `${authData.user.id}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
              .from('id_photos')
              .upload(fileName, idPhoto);

            if (uploadError) throw uploadError;
            
            photoUrl = fileName;
          }

          // Create profile
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              full_name: fullName,
              country,
              phone,
              address,
              id_photo: photoUrl
            })
            .eq('id', authData.user.id);

          if (profileError) throw profileError;
        }

        toast.success("Compte créé avec succès! Vérifiez votre email pour confirmer votre compte.", {
          duration: 6000,
        });
        setIsSignUp(false);
      } else {
        // Login with phone number
        const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
          phone,
          password,
        });

        if (signInError) throw signInError;

        toast.success("Connexion réussie! Redirection...");
      }
    } catch (error: any) {
      console.error("Erreur d'authentification:", error);
      let errorMessage = "Une erreur est survenue";
      
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Numéro de téléphone ou mot de passe incorrect";
      } else if (error.message.includes("Phone not confirmed")) {
        errorMessage = "Veuillez confirmer votre numéro de téléphone avant de vous connecter";
      } else if (error.message.includes("User already registered")) {
        errorMessage = "Un compte existe déjà avec ce numéro";
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isSignUp ? "Créer un compte" : "Connexion"}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignUp
              ? "Créez votre compte pour commencer à utiliser SendFlow"
              : "Connectez-vous à votre compte SendFlow"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Pays</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                    className="w-full"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    className="w-full"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idPhoto">Photo d'identité</Label>
                  <Input
                    id="idPhoto"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                    className="w-full"
                    disabled={loading}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+33612345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
                disabled={loading}
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={loading}
            >
              {loading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              {loading
                ? "Chargement..."
                : isSignUp
                ? "Créer un compte"
                : "Se connecter"}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Ou
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full"
              disabled={loading}
            >
              {isSignUp
                ? "Déjà un compte? Se connecter"
                : "Pas de compte? S'inscrire"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;