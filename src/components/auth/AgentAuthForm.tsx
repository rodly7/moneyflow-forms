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

const AgentAuthForm = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  
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

  // Fonction pour normaliser les numéros de téléphone
  const normalizePhoneNumber = (phoneInput: string, countryCode?: string) => {
    // Supprimer tous les espaces et caractères non numériques sauf le +
    let cleanPhone = phoneInput.replace(/[^\d+]/g, '');
    
    // Si pas de +, ajouter le code pays si disponible
    if (!cleanPhone.startsWith('+') && countryCode) {
      cleanPhone = countryCode + cleanPhone;
    }
    
    console.log('📱 Numéro normalisé:', cleanPhone, 'depuis:', phoneInput);
    return cleanPhone;
  };

  const formatPhoneWithCountryCode = (countryCode: string, number: string) => {
    const cleanNumber = number.replace(/\D/g, '');
    const fullPhone = `${countryCode}${cleanNumber}`;
    console.log('📱 Formatage complet:', fullPhone);
    return fullPhone;
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setPhoneNumber(value);
    const formattedPhone = formatPhoneWithCountryCode(selectedCountryCode, value);
    setPhone(formattedPhone);
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

        // Normaliser le numéro pour l'inscription
        const normalizedPhone = normalizePhoneNumber(phone);
        
        console.log('🏢 Inscription AGENT avec numéro normalisé:', {
          phone: normalizedPhone,
          originalPhone: phone,
          fullName: fullName,
          country: country,
          address: address,
          role: "agent"
        });
        
        await signUp(normalizedPhone, password, {
          full_name: fullName,
          country: country,
          address: address,
          phone: normalizedPhone,
          role: "agent",
        });
        
        toast.success("Compte agent créé avec succès! Redirection en cours...");
        console.log('✅ Inscription agent réussie avec numéro:', normalizedPhone);
        
      } else {
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
      }
    } catch (error: any) {
      console.error("Erreur d'authentification agent:", error);
      
      let errorMessage = "Une erreur est survenue";
      
      if (error.message.includes("Numéro de téléphone ou mot de passe incorrect") || 
          error.message.includes("Invalid login credentials")) {
        errorMessage = "Numéro de téléphone ou mot de passe incorrect. Assurez-vous d'utiliser le même format de numéro qu'à l'inscription (avec le code pays).";
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
    <div className="min-h-screen bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-blue-600">
            {isSignUp ? "Créer un compte Agent" : "Connexion Agent"}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignUp
              ? "Créez votre compte agent SendFlow"
              : "Connectez-vous à votre espace agent"}
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
                  <p className="text-xs text-blue-600">
                    📱 Votre numéro sera: {phone}
                  </p>
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
              </>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              {loading
                ? "Chargement..."
                : isSignUp
                ? "Créer un compte agent"
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
                ? "Déjà un compte agent? Se connecter"
                : "Pas de compte agent? S'inscrire"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentAuthForm;
