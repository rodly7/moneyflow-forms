
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
import { useNavigate } from "react-router-dom";

const AgentSignUpForm = () => {
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  
  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phone, setPhone] = useState("");
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
      if (!country || !address || !phone || !password || !fullName) {
        throw new Error("Veuillez remplir tous les champs");
      }
      
      if (fullName.length < 2) {
        throw new Error("Le nom complet doit contenir au moins 2 caractères");
      }
      
      console.log('🏢 Inscription AGENT SPÉCIFIQUE avec:', {
        phone: phone,
        fullName: fullName,
        country: country,
        address: address,
        role: "agent"
      });
      
      await signUp(phone, password, {
        full_name: fullName,
        country: country,
        address: address,
        phone: phone,
        role: "agent",
      });
      
      toast.success("Compte agent créé avec succès! Redirection vers le tableau de bord...");
      
      // Redirection explicite vers le tableau de bord agent
      setTimeout(() => {
        navigate('/agent-dashboard', { replace: true });
      }, 1000);
      
    } catch (error: any) {
      console.error("Erreur d'inscription agent:", error);
      
      let errorMessage = "Une erreur est survenue";
      
      if (error.message.includes("Un compte existe déjà")) {
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
            Inscription Agent SendFlow
          </CardTitle>
          <CardDescription className="text-center">
            Créez votre compte agent pour commencer à servir vos clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              {loading ? "Création du compte..." : "Créer mon compte agent"}
            </Button>

            <div className="mt-4 text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => navigate('/agent-auth')}
                className="text-blue-600 hover:text-blue-700"
              >
                Déjà un compte agent? Se connecter
              </Button>
            </div>

            <div className="mt-2 text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => navigate('/auth')}
                className="text-gray-600 hover:text-gray-700 text-sm"
              >
                Créer un compte utilisateur classique
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentSignUpForm;
