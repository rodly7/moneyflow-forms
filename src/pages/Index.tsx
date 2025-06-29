
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Shield, Globe, Users, TrendingUp, Star } from "lucide-react";

const Index = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'admin') {
        navigate('/admin-dashboard');
      } else if (profile.role === 'sub_admin') {
        navigate('/sub-admin-dashboard');
      } else if (profile.role === 'agent') {
        navigate('/agent-dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, profile, navigate]);

  if (user) {
    return null; // Redirection en cours
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 md:w-64 md:h-64 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 md:w-96 md:h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-100/10 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8 md:py-16">
        {/* Hero Section */}
        <div className="text-center mb-12 md:mb-20">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6 shadow-2xl">
            <Zap className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
            SendFlow
          </h1>
          
          <p className="text-lg md:text-xl lg:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            La plateforme de transfert d'argent la plus rapide et sécurisée d'Afrique. 
            Envoyez et recevez de l'argent instantanément, partout dans le monde.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={() => navigate('/auth')}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 h-14 text-lg shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 transition-all duration-300"
            >
              Commencer maintenant
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
            
            <Button 
              onClick={() => navigate('/agent-auth')}
              variant="outline"
              size="lg"
              className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50 font-semibold px-8 py-4 h-14 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              Espace Agent
              <Shield className="ml-2 h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-16">
          {/* Feature 1 */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-300 group">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl md:text-2xl font-bold text-gray-800">
                Transferts Instantanés
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 leading-relaxed">
                Envoyez de l'argent en quelques secondes vers n'importe quel pays d'Afrique. 
                Nos technologies avancées garantissent des transferts ultra-rapides.
              </p>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-300 group">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl md:text-2xl font-bold text-gray-800">
                Sécurité Maximale
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 leading-relaxed">
                Vos transactions sont protégées par un cryptage de niveau bancaire. 
                Nous utilisons les dernières technologies de sécurité pour protéger vos fonds.
              </p>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-300 group">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl md:text-2xl font-bold text-gray-800">
                Couverture Globale
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 leading-relaxed">
                Présent dans plus de 15 pays africains avec un réseau d'agents locaux. 
                Transférez vers le Cameroun, Congo, Gabon, Sénégal et bien plus encore.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-6 md:p-12 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            SendFlow en Chiffres
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">500K+</h3>
              <p className="text-gray-600">Utilisateurs Actifs</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">2M+</h3>
              <p className="text-gray-600">Transactions Effectuées</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">15+</h3>
              <p className="text-gray-600">Pays Couverts</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">4.9/5</h3>
              <p className="text-gray-600">Note Utilisateurs</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white border-0 shadow-2xl">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Prêt à commencer ?
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                Rejoignez des milliers d'utilisateurs qui font confiance à SendFlow pour leurs transferts d'argent.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => navigate('/auth')}
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-4 h-14 text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  Créer un compte
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
                
                <Button 
                  onClick={() => navigate('/agent-auth')}
                  variant="outline"
                  size="lg"
                  className="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-semibold px-8 py-4 h-14 text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  Devenir Agent
                  <Shield className="ml-2 h-6 w-6" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
