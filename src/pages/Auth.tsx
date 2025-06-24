import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/ui/icons";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { countries } from "@/data/countries";
import { useNavigate, useSearchParams } from "react-router-dom";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const isAgentMode = searchParams.get('role') === 'agent';
  
  const [isSignUp, setIsSignUp] = useState(isAgentMode);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  
  // Login fields
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Additional signup fields
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  const handleCountryChange = (value: string) => {
    const selectedCountry = countries.find(c => c.name === value);
    if (selectedCountry) {
      setCountry(value);
      setSelectedCountryCode(selectedCountry.code);
      setAvailableCities(selectedCountry.cities.map(city => city.name));
      setAddress("");
      setPhone(selectedCountry.code);
      setPhoneNumber("");
    }
  };

  const formatPhoneWithCountryCode = (countryCode: string, number: string) => {
    return `${countryCode}${number.replace(/\D/g, '')}`;
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setPhoneNumber(value);
    setPhone(formatPhoneWithCountryCode(selectedCountryCode, value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Validation des champs
        if (!country || !address || !phone || !password || !fullName) {
          throw new Error("Veuillez remplir tous les champs");
        }
        
        if (fullName.length < 2) {
          throw new Error("Le nom complet doit contenir au moins 2 caractères");
        }
        
        const userRole = isAgentMode ? "agent" : "user";
        
        console.log('🔐 Inscription avec:', {
          phone: phone,
          fullName: fullName,
          country: country,
          address: address,
          role: userRole
        });
        
        await signUp(phone, password, {
          full_name: fullName,
          country: country,
          address: address,
          phone: phone,
          role: userRole,
        });
        
        const successMessage = isAgentMode ? "Compte agent créé avec succès!" : "Compte créé avec succès!";
        toast.success(successMessage);
        
        // Redirection immédiate après inscription pour les agents
        if (isAgentMode) {
          console.log('🏢 Redirection immédiate vers agent-dashboard');
          navigate('/agent-dashboard', { replace: true });
        } else {
          setIsSignUp(false);
        }
      } else {
        // Connexion simplifiée
        if (!loginPhone || !loginPassword) {
          throw new Error("Veuillez remplir tous les champs");
        }

        console.log('🔐 Connexion avec le numéro exact:', loginPhone);
        await signIn(loginPhone, loginPassword);
        toast.success("Connexion réussie!");
      }
    } catch (error: any) {
      console.error("Erreur d'authentification:", error);
      
      let errorMessage = "Une erreur est survenue";
      
      if (error.message.includes("Numéro de téléphone ou mot de passe incorrect")) {
        errorMessage = "Numéro de téléphone ou mot de passe incorrect. Vérifiez que vous utilisez exactement le même numéro qu'à l'inscription.";
      } else if (error.message.includes("Un compte existe déjà")) {
        errorMessage = "Un compte existe déjà avec ce numéro. Essayez de vous connecter.";
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

  function getTitle() {
    if (isAgentMode) {
      return isSignUp ? "Créer un compte Agent" : "Connexion Agent";
    }
    return isSignUp ? "Créer un compte" : "Connexion";
  }

  function getDescription() {
    if (isAgentMode) {
      return isSignUp ? "Créez votre compte agent SendFlow" : "Connectez-vous à votre espace agent";
    }
    return isSignUp
      ? "Créez votre compte utilisateur SendFlow"
      : "Connectez-vous à votre compte SendFlow";
  }

  function getGradientColors() {
    if (isAgentMode) {
      return "from-blue-500/20 to-indigo-500/20";
    }
    return "from-emerald-500/20 to-blue-500/20";
  }

  function getButtonColors() {
    if (isAgentMode) {
      return "bg-blue-600 hover:bg-blue-700";
    }
    return "bg-emerald-600 hover:bg-emerald-700";
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getGradientColors()} flex items-center justify-center p-4`}>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className={`text-2xl font-bold text-center ${isAgentMode ? 'text-blue-600' : ''}`}>
            {getTitle()}
          </CardTitle>
          <CardDescription className="text-center">
            {getDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp ? (
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
                    minLength={2}
                    maxLength={100}
                    placeholder="Votre nom complet"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Pays</Label>
                  <Select
                    value={country}
                    onValueChange={handleCountryChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre pays" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.name} value={country.name}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Ville</Label>
                  <Select
                    value={address}
                    onValueChange={setAddress}
                    disabled={!country}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre ville" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Numéro de téléphone</Label>
                  <div className="flex gap-2">
                    <div className="w-24">
                      <Input
                        value={selectedCountryCode}
                        readOnly
                        className="bg-gray-100"
                      />
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="XX XXX XXXX"
                      value={phoneNumber}
                      onChange={handlePhoneNumberChange}
                      required
                      className="w-full"
                      disabled={loading || !selectedCountryCode}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full"
                    disabled={loading}
                    minLength={6}
                    placeholder="Au moins 6 caractères"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="loginPhone">Numéro de téléphone</Label>
                  <Input
                    id="loginPhone"
                    type="text"
                    placeholder="Entrez exactement votre numéro (ex: +242XXXXXXXX)"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    required
                    className="w-full"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500">
                    ⚠️ Utilisez exactement le même format de numéro que lors de l'inscription
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
              </>
            )}

            <Button
              type="submit"
              className={`w-full ${getButtonColors()} text-white`}
              disabled={loading}
            >
              {loading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              {loading
                ? "Chargement..."
                : isSignUp
                ? (isAgentMode ? "Créer mon compte agent" : "Créer un compte")
                : "Se connecter"}
            </Button>

            {!isAgentMode && (
              <>
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
              </>
            )}

            {!isAgentMode && (
              <div className="mt-4 text-center space-y-2">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => navigate('/auth?role=agent')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Créer un compte agent
                </Button>
                
                <div className="text-sm text-gray-500">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => navigate('/agent-auth')}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Déjà agent? Se connecter ici
                  </Button>
                </div>
              </div>
            )}

            {isAgentMode && (
              <div className="mt-4 text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => navigate('/auth')}
                  className="text-gray-600 hover:text-gray-700"
                >
                  Retour à la connexion normale
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
