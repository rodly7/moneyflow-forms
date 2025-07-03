
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
import { Zap, Shield, User, Phone, MapPin, Lock, ArrowLeft, Sparkles, Crown, Eye, EyeOff, CheckCircle2 } from "lucide-react";

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
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Additional signup fields
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Enhanced background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/10 via-indigo-600/10 to-purple-600/10"></div>
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-purple-300/15 to-blue-300/15 rounded-full blur-3xl animate-bounce-gentle"></div>
      </div>
      
      {/* Back to home button */}
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="fixed top-6 left-6 text-white/90 hover:text-white hover:bg-white/15 backdrop-blur-md rounded-xl z-20 transition-all duration-300 border border-white/20 shadow-lg"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Accueil
      </Button>

      <Card className="w-full max-w-2xl backdrop-blur-2xl bg-white/5 shadow-2xl border border-white/20 animate-fade-in hover:shadow-blue-500/20 transition-all duration-500 relative overflow-hidden rounded-3xl">
        {/* Card glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 opacity-60"></div>
        
        <CardHeader className="space-y-8 text-center pb-10 relative z-10 px-10">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 rounded-full flex items-center justify-center mb-6 animate-pulse-glow shadow-2xl">
            {isAgentMode ? (
              <Crown className="w-10 h-10 text-white animate-bounce-gentle" />
            ) : (
              <Zap className="w-10 h-10 text-white animate-bounce-gentle" />
            )}
          </div>
          
          <div className="space-y-4">
            <CardTitle className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-100 bg-clip-text text-transparent animate-scale-in leading-tight">
              {isSignUp ? (
                <>
                  {isAgentMode ? "👑 Devenir Agent" : "✨ Créer un compte"}
                </>
              ) : (
                "🔐 Connexion"
              )}
            </CardTitle>
            
            <CardDescription className="text-white/90 text-lg font-medium">
              {isSignUp ? (
                <>
                  {isAgentMode ? "Rejoignez notre réseau d'agents privilégiés" : "Rejoignez SendFlow dès aujourd'hui"}
                </>
              ) : (
                "Bienvenue de retour sur SendFlow"
              )}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-8 relative z-10 px-10 pb-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp ? (
              <div className="space-y-6">
                {/* Full Name */}
                <div className="space-y-3">
                  <Label htmlFor="fullName" className="text-white font-semibold flex items-center gap-3 text-base">
                    <User className="w-5 h-5 text-blue-300" />
                    Nom complet
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="Entrez votre nom complet"
                    className="h-12 bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-blue-400 focus:ring-blue-400/30 backdrop-blur-md transition-all duration-300 hover:bg-white/15 rounded-xl text-base"
                  />
                </div>

                {/* Country */}
                <div className="space-y-3">
                  <Label htmlFor="country" className="text-white font-semibold flex items-center gap-3 text-base">
                    <MapPin className="w-5 h-5 text-blue-300" />
                    Pays
                  </Label>
                  <Select value={country} onValueChange={handleCountryChange}>
                    <SelectTrigger className="h-12 bg-white/10 border-white/30 text-white focus:border-blue-400 focus:ring-blue-400/30 backdrop-blur-md hover:bg-white/15 transition-all duration-300 rounded-xl text-base">
                      <SelectValue placeholder="Sélectionnez votre pays" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-xl border-white/20 rounded-xl max-h-[200px]">
                      {countries.map((country) => (
                        <SelectItem key={country.name} value={country.name} className="hover:bg-blue-100 rounded-lg text-sm">
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* City */}
                <div className="space-y-3">
                  <Label htmlFor="address" className="text-white font-semibold flex items-center gap-3 text-base">
                    <MapPin className="w-5 h-5 text-blue-300" />
                    Ville
                  </Label>
                  <Select value={address} onValueChange={setAddress} disabled={!country}>
                    <SelectTrigger className="h-12 bg-white/10 border-white/30 text-white focus:border-blue-400 focus:ring-blue-400/30 backdrop-blur-md hover:bg-white/15 transition-all duration-300 rounded-xl text-base disabled:opacity-50">
                      <SelectValue placeholder="Sélectionnez votre ville" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-xl border-white/20 rounded-xl max-h-[200px]">
                      {availableCities.map((city) => (
                        <SelectItem key={city} value={city} className="hover:bg-blue-100 rounded-lg text-sm">
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Phone Number */}
                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-white font-semibold flex items-center gap-3 text-base">
                    <Phone className="w-5 h-5 text-blue-300" />
                    Numéro de téléphone
                  </Label>
                  <div className="flex gap-3">
                    <div className="w-28">
                      <Input 
                        value={selectedCountryCode} 
                        readOnly 
                        className="h-12 bg-white/15 text-center font-mono text-white border-white/30 backdrop-blur-md rounded-xl text-sm font-semibold" 
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
                      className="h-12 bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-blue-400 focus:ring-blue-400/30 backdrop-blur-md hover:bg-white/15 transition-all duration-300 rounded-xl text-base flex-1"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-white font-semibold flex items-center gap-3 text-base">
                    <Lock className="w-5 h-5 text-blue-300" />
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      minLength={6}
                      placeholder="Au moins 6 caractères"
                      className="h-12 bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-blue-400 focus:ring-blue-400/30 backdrop-blur-md hover:bg-white/15 transition-all duration-300 rounded-xl text-base pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Login Phone */}
                <div className="space-y-3">
                  <Label htmlFor="loginPhone" className="text-white font-semibold flex items-center gap-3 text-base">
                    <Phone className="w-5 h-5 text-blue-300" />
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
                    className="h-12 bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-blue-400 focus:ring-blue-400/30 backdrop-blur-md hover:bg-white/15 transition-all duration-300 rounded-xl text-base"
                  />
                  <div className="flex items-center gap-2 text-sm text-blue-200 font-medium bg-blue-500/15 p-3 rounded-lg backdrop-blur-sm border border-blue-400/20">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>Utilisez exactement le même format qu&apos;à l&apos;inscription</span>
                  </div>
                </div>

                {/* Login Password */}
                <div className="space-y-3">
                  <Label htmlFor="loginPassword" className="text-white font-semibold flex items-center gap-3 text-base">
                    <Lock className="w-5 h-5 text-blue-300" />
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Input
                      id="loginPassword"
                      type={showLoginPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      disabled={loading}
                      minLength={6}
                      placeholder="Votre mot de passe"
                      className="h-12 bg-white/10 border-white/30 text-white placeholder:text-white/60 focus:border-blue-400 focus:ring-blue-400/30 backdrop-blur-md hover:bg-white/15 transition-all duration-300 rounded-xl text-base pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                    >
                      {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-14 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-600 text-white font-bold shadow-2xl hover:shadow-blue-500/30 transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 text-lg rounded-xl mt-8" 
              disabled={loading}
            >
              {loading && <Icons.spinner className="mr-3 h-6 w-6 animate-spin" />}
              {loading ? (
                "⏳ Chargement..."
              ) : isSignUp ? (
                <>
                  <Sparkles className="mr-3 h-6 w-6" />
                  {isAgentMode ? "👑 Créer compte agent" : "✨ Créer un compte"}
                </>
              ) : (
                <>
                  <Shield className="mr-3 h-6 w-6" />
                  🔐 Se connecter
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-sm uppercase">
                <span className="bg-white/10 backdrop-blur-md px-6 py-2 text-white/90 font-semibold rounded-full border border-white/20">Ou</span>
              </div>
            </div>

            {/* Toggle Sign Up/Login */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full h-12 border-2 border-white/30 bg-white/5 text-white hover:bg-white/15 hover:border-white/50 backdrop-blur-md transition-all duration-300 font-semibold rounded-xl text-base"
              disabled={loading}
            >
              {isSignUp ? "🔑 Déjà un compte? Se connecter" : "✨ Pas de compte? S&apos;inscrire"}
            </Button>

            {/* Agent Links */}
            <div className="mt-8 text-center space-y-4">
              <Button
                type="button"
                variant="link"
                onClick={() => navigate('/auth?role=agent')}
                className="text-blue-200 hover:text-blue-100 font-bold hover:underline text-base transition-colors duration-300"
              >
                👑 Créer un compte agent
              </Button>
              
              <div className="text-sm">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => navigate('/agent-auth')}
                  className="text-indigo-200 hover:text-indigo-100 hover:underline font-medium transition-colors duration-300 text-sm"
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
