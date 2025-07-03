
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
import { Zap, Shield, User, Phone, MapPin, Lock, ArrowLeft, Sparkles, Crown } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cyan-600/10 via-purple-600/10 to-pink-600/10"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-indigo-300/10 to-violet-300/10 rounded-full blur-3xl animate-bounce-gentle"></div>
        
        {/* Floating particles */}
        <div className="absolute top-10 left-10 w-3 h-3 bg-cyan-400/60 rounded-full animate-pulse"></div>
        <div className="absolute top-20 right-20 w-4 h-4 bg-pink-400/60 rounded-full animate-pulse delay-500"></div>
        <div className="absolute bottom-20 left-20 w-2 h-2 bg-purple-400/60 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-10 right-10 w-5 h-5 bg-blue-400/60 rounded-full animate-pulse delay-1500"></div>
      </div>
      
      {/* Back to home button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm rounded-xl z-20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Accueil
      </Button>

      <Card className="w-full max-w-lg backdrop-blur-xl bg-white/10 shadow-2xl border border-white/20 animate-fade-in hover:shadow-purple-500/20 transition-all duration-500 relative overflow-hidden">
        {/* Card glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5 opacity-50"></div>
        
        <CardHeader className="space-y-4 text-center pb-8 relative z-10">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6 animate-pulse-glow shadow-2xl">
            {isAgentMode ? (
              <Crown className="w-10 h-10 text-white animate-bounce-gentle" />
            ) : (
              <Zap className="w-10 h-10 text-white animate-bounce-gentle" />
            )}
          </div>
          
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent animate-scale-in">
            {isSignUp ? (
              <>
                {isAgentMode ? "👑 Devenir Agent" : "✨ Créer un compte"}
              </>
            ) : (
              "🔐 Connexion"
            )}
          </CardTitle>
          
          <CardDescription className="text-white/80 text-lg font-medium">
            {isSignUp ? (
              <>
                {isAgentMode ? "Rejoignez notre réseau d'agents privilégiés" : "Rejoignez SendFlow dès aujourd'hui"}
              </>
            ) : (
              "Bienvenue de retour sur SendFlow"
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp ? (
              <>
                <div className="space-y-3">
                  <Label htmlFor="fullName" className="text-white font-semibold flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nom complet
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="Entrez votre nom complet"
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-cyan-400 focus:ring-cyan-400/20 backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="country" className="text-white font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Pays
                  </Label>
                  <Select value={country} onValueChange={handleCountryChange}>
                    <SelectTrigger className="h-12 bg-white/10 border-white/20 text-white focus:border-cyan-400 focus:ring-cyan-400/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300">
                      <SelectValue placeholder="Sélectionnez votre pays" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-xl border-white/20">
                      {countries.map((country) => (
                        <SelectItem key={country.name} value={country.name} className="hover:bg-purple-100">
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="address" className="text-white font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Ville
                  </Label>
                  <Select value={address} onValueChange={setAddress} disabled={!country}>
                    <SelectTrigger className="h-12 bg-white/10 border-white/20 text-white focus:border-cyan-400 focus:ring-cyan-400/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300">
                      <SelectValue placeholder="Sélectionnez votre ville" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-xl border-white/20">
                      {availableCities.map((city) => (
                        <SelectItem key={city} value={city} className="hover:bg-purple-100">
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-white font-semibold flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Numéro de téléphone
                  </Label>
                  <div className="flex gap-3">
                    <div className="w-28">
                      <Input 
                        value={selectedCountryCode} 
                        readOnly 
                        className="h-12 bg-white/15 text-center font-mono text-white border-white/20 backdrop-blur-sm" 
                      />
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="XX XXX XXXX"
                      value={phoneNumber}
                      onChange={handlePhoneNumberChange}
                      required
                      disabled={loading || !selectedCountryCode}
                      className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-cyan-400 focus:ring-cyan-400/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="password" className="text-white font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Mot de passe
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                    placeholder="Au moins 6 caractères"
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-cyan-400 focus:ring-cyan-400/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <Label htmlFor="loginPhone" className="text-white font-semibold flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Numéro de téléphone
                  </Label>
                  <Input
                    id="loginPhone"
                    type="text"
                    placeholder="Entrez exactement votre numéro (ex: +242XXXXXXXX)"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-cyan-400 focus:ring-cyan-400/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300"
                  />
                  <p className="text-xs text-cyan-300 flex items-center gap-1 font-medium">
                    💡 Utilisez exactement le même format qu'à l'inscription
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="loginPassword" className="text-white font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Mot de passe
                  </Label>
                  <Input
                    id="loginPassword"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-cyan-400 focus:ring-cyan-400/20 backdrop-blur-sm hover:bg-white/15 transition-all duration-300"
                  />
                </div>
              </>
            )}

            <Button 
              type="submit" 
              className="w-full h-14 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold shadow-2xl hover:shadow-cyan-500/25 transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 text-lg rounded-xl" 
              disabled={loading}
            >
              {loading && <Icons.spinner className="mr-3 h-6 w-6 animate-spin" />}
              {loading ? (
                "⏳ Chargement..."
              ) : isSignUp ? (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  {isAgentMode ? "👑 Créer compte agent" : "✨ Créer un compte"}
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-5 w-5" />
                  🔐 Se connecter
                </>
              )}
            </Button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/30" />
              </div>
              <div className="relative flex justify-center text-sm uppercase">
                <span className="bg-white/10 backdrop-blur-sm px-6 py-2 text-white/80 font-semibold rounded-full border border-white/20">Ou</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full h-12 border-2 border-white/30 bg-white/5 text-white hover:bg-white/10 hover:border-white/50 backdrop-blur-sm transition-all duration-300 font-semibold rounded-xl"
              disabled={loading}
            >
              {isSignUp ? "🔑 Déjà un compte? Se connecter" : "✨ Pas de compte? S'inscrire"}
            </Button>

            <div className="mt-8 text-center space-y-4">
              <Button
                type="button"
                variant="link"
                onClick={() => navigate('/auth?role=agent')}
                className="text-cyan-300 hover:text-cyan-200 font-bold hover:underline text-lg transition-colors duration-300"
              >
                👑 Créer un compte agent
              </Button>
              
              <div className="text-sm">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => navigate('/agent-auth')}
                  className="text-purple-300 hover:text-purple-200 hover:underline font-medium transition-colors duration-300"
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
