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
        if (!country || !address || !phone || !password || !fullName) {
          throw new Error("Veuillez remplir tous les champs");
        }
        
        if (fullName.length < 2) {
          throw new Error("Le nom complet doit contenir au moins 2 caractères");
        }
        
        const userRole = isAgentMode ? "agent" : "user";
        
        await signUp(phone, password, {
          full_name: fullName,
          country: country,
          address: address,
          phone: phone,
          role: userRole,
        });
        
        const successMessage = isAgentMode ? "Compte agent créé avec succès!" : "Compte créé avec succès!";
        toast.success(successMessage);
        
        if (!isAgentMode) {
          setIsSignUp(false);
        }
      } else {
        if (!loginPhone || !loginPassword) {
          throw new Error("Veuillez remplir tous les champs");
        }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-cyan-400 to-blue-500 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 via-cyan-400/20 to-blue-500/20"></div>
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-white/5 rounded-full blur-2xl animate-pulse delay-1000"></div>
      
      <Card className="w-full max-w-md backdrop-blur-sm bg-white/95 shadow-2xl border-0 animate-fade-in">
        <CardHeader className="space-y-2 text-center pb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mb-4 animate-scale-in">
            <Icons.spinner className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            {isSignUp ? "Créer un compte" : "Connexion"}
          </CardTitle>
          <CardDescription className="text-gray-600 text-lg">
            {isSignUp ? "Rejoignez SendFlow dès aujourd'hui" : "Bienvenue sur SendFlow"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-gray-700 font-medium">Nom complet</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="Votre nom complet"
                    className="h-12 bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="text-gray-700 font-medium">Pays</Label>
                  <Select value={country} onValueChange={handleCountryChange}>
                    <SelectTrigger className="h-12 bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500">
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
                  <Label htmlFor="address" className="text-gray-700 font-medium">Ville</Label>
                  <Select value={address} onValueChange={setAddress} disabled={!country}>
                    <SelectTrigger className="h-12 bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500">
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
                  <Label htmlFor="phone" className="text-gray-700 font-medium">Numéro de téléphone</Label>
                  <div className="flex gap-3">
                    <div className="w-24">
                      <Input value={selectedCountryCode} readOnly className="h-12 bg-gray-100 text-center font-mono" />
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="XX XXX XXXX"
                      value={phoneNumber}
                      onChange={handlePhoneNumberChange}
                      required
                      disabled={loading || !selectedCountryCode}
                      className="h-12 bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                    placeholder="Au moins 6 caractères"
                    className="h-12 bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="loginPhone" className="text-gray-700 font-medium">Numéro de téléphone</Label>
                  <Input
                    id="loginPhone"
                    type="text"
                    placeholder="Entrez exactement votre numéro (ex: +242XXXXXXXX)"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    💡 Utilisez exactement le même format qu'à l'inscription
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
                    disabled={loading}
                    minLength={6}
                    className="h-12 bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200" 
              disabled={loading}
            >
              {loading && <Icons.spinner className="mr-2 h-5 w-5 animate-spin" />}
              {loading ? "Chargement..." : isSignUp ? "Créer un compte" : "Se connecter"}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-4 text-gray-500 font-medium">Ou</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full h-12 border-2 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-200"
              disabled={loading}
            >
              {isSignUp ? "Déjà un compte? Se connecter" : "Pas de compte? S'inscrire"}
            </Button>

            <div className="mt-6 text-center space-y-3">
              <Button
                type="button"
                variant="link"
                onClick={() => navigate('/auth?role=agent')}
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
              >
                🏢 Créer un compte agent
              </Button>
              
              <div className="text-sm">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => navigate('/agent-auth')}
                  className="text-emerald-600 hover:text-emerald-700 text-sm hover:underline"
                >
                  Déjà agent? Se connecter ici →
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
