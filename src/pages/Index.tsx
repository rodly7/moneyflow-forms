
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Shield, Globe, Users, TrendingUp, Star, Sparkles, Crown, Award } from "lucide-react";

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
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden">
      {/* Enhanced background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-indigo-300/10 to-purple-300/10 rounded-full blur-3xl animate-bounce-gentle"></div>
        
        {/* Floating particles */}
        <div className="absolute top-10 left-10 w-4 h-4 bg-cyan-400/60 rounded-full animate-pulse"></div>
        <div className="absolute top-20 right-20 w-6 h-6 bg-pink-400/60 rounded-full animate-pulse delay-500"></div>
        <div className="absolute bottom-20 left-20 w-5 h-5 bg-purple-400/60 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-10 right-10 w-3 h-3 bg-blue-400/60 rounded-full animate-pulse delay-1500"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-4 py-8 md:py-16">
        {/* Enhanced Hero Section */}
        <div className="text-center mb-12 md:mb-20 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full mb-8 shadow-2xl animate-pulse-glow">
            <Zap className="w-10 h-10 md:w-12 md:h-12 text-white animate-bounce-gentle" />
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent leading-tight animate-scale-in">
            SendFlow
          </h1>
          
          <div className="relative">
            <p className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-10 max-w-5xl mx-auto leading-relaxed font-light animate-slide-up">
              🚀 La plateforme de transfert d'argent la plus rapide et sécurisée d'Afrique. 
              <br />
              <span className="text-cyan-300 font-medium">Envoyez et recevez de l'argent instantanément, partout dans le monde.</span>
            </p>
            <div className="absolute -top-4 -right-4 text-4xl animate-bounce-gentle">✨</div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-scale-in">
            <Button 
              onClick={() => navigate('/auth')}
              size="xl"
              className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-600 hover:via-blue-600 hover:to-purple-700 text-white font-bold px-12 py-6 h-16 text-xl shadow-2xl hover:shadow-cyan-500/25 transform hover:-translate-y-2 hover:scale-110 transition-all duration-300 rounded-2xl border-2 border-white/20"
            >
              <Sparkles className="mr-3 h-7 w-7" />
              🌟 Commencer maintenant
              <ArrowRight className="ml-3 h-7 w-7" />
            </Button>
            
            <Button 
              onClick={() => navigate('/agent-auth')}
              variant="outline"
              size="xl"
              className="border-3 border-cyan-300/60 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 hover:border-cyan-300 font-bold px-12 py-6 h-16 text-xl shadow-2xl hover:shadow-cyan-500/25 transform hover:-translate-y-2 hover:scale-110 transition-all duration-300 rounded-2xl"
            >
              <Shield className="mr-3 h-7 w-7" />
              👨‍💼 Espace Agent
              <Crown className="ml-3 h-7 w-7" />
            </Button>
          </div>
        </div>

        {/* Enhanced Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 mb-20 animate-slide-up">
          {/* Feature 1 - Enhanced */}
          <Card className="bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 backdrop-blur-xl border-2 border-cyan-300/30 shadow-2xl hover:shadow-cyan-500/40 transform hover:-translate-y-4 hover:scale-105 hover:rotate-1 transition-all duration-500 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="text-center pb-4 relative z-10">
              <div className="w-20 h-20 bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500 shadow-xl">
                <Zap className="w-10 h-10 text-white animate-pulse" />
              </div>
              <CardTitle className="text-2xl md:text-3xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors duration-300">
                ⚡ Transferts Instantanés
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center relative z-10">
              <p className="text-white/80 leading-relaxed text-lg group-hover:text-white transition-colors duration-300">
                Envoyez de l'argent en quelques secondes vers n'importe quel pays d'Afrique. 
                Nos technologies avancées garantissent des transferts ultra-rapides.
              </p>
            </CardContent>
          </Card>

          {/* Feature 2 - Enhanced */}
          <Card className="bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-teal-500/20 backdrop-blur-xl border-2 border-emerald-300/30 shadow-2xl hover:shadow-emerald-500/40 transform hover:-translate-y-4 hover:scale-105 hover:rotate-1 transition-all duration-500 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="text-center pb-4 relative z-10">
              <div className="w-20 h-20 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500 shadow-xl">
                <Shield className="w-10 h-10 text-white animate-pulse" />
              </div>
              <CardTitle className="text-2xl md:text-3xl font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors duration-300">
                🛡️ Sécurité Maximale
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center relative z-10">
              <p className="text-white/80 leading-relaxed text-lg group-hover:text-white transition-colors duration-300">
                Vos transactions sont protégées par un cryptage de niveau bancaire. 
                Nous utilisons les dernières technologies de sécurité pour protéger vos fonds.
              </p>
            </CardContent>
          </Card>

          {/* Feature 3 - Enhanced */}
          <Card className="bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-rose-500/20 backdrop-blur-xl border-2 border-purple-300/30 shadow-2xl hover:shadow-purple-500/40 transform hover:-translate-y-4 hover:scale-105 hover:rotate-1 transition-all duration-500 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <CardHeader className="text-center pb-4 relative z-10">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-400 via-pink-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500 shadow-xl">
                <Globe className="w-10 h-10 text-white animate-pulse" />
              </div>
              <CardTitle className="text-2xl md:text-3xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors duration-300">
                🌍 Couverture Globale
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center relative z-10">
              <p className="text-white/80 leading-relaxed text-lg group-hover:text-white transition-colors duration-300">
                Présent dans plus de 15 pays africains avec un réseau d'agents locaux. 
                Transférez vers le Cameroun, Congo, Gabon, Sénégal et bien plus encore.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Stats Section */}
        <div className="bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-16 mb-20 border border-white/20 animate-scale-in hover:shadow-white/20 transition-all duration-500">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 md:mb-16 bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent animate-pulse-glow">
            ✨ SendFlow en Chiffres
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            <div className="text-center group transform hover:scale-110 transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:shadow-blue-500/50 animate-bounce-gentle">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-4xl md:text-5xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors duration-300">500K+</h3>
              <p className="text-white/80 text-lg font-medium group-hover:text-white transition-colors duration-300">👥 Utilisateurs Actifs</p>
            </div>
            
            <div className="text-center group transform hover:scale-110 transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:shadow-emerald-500/50 animate-bounce-gentle delay-200">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-4xl md:text-5xl font-bold text-white mb-3 group-hover:text-emerald-300 transition-colors duration-300">2M+</h3>
              <p className="text-white/80 text-lg font-medium group-hover:text-white transition-colors duration-300">📊 Transactions Effectuées</p>
            </div>
            
            <div className="text-center group transform hover:scale-110 transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:shadow-purple-500/50 animate-bounce-gentle delay-500">
                <Globe className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-4xl md:text-5xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors duration-300">15+</h3>
              <p className="text-white/80 text-lg font-medium group-hover:text-white transition-colors duration-300">🌍 Pays Couverts</p>
            </div>
            
            <div className="text-center group transform hover:scale-110 transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:shadow-orange-500/50 animate-bounce-gentle delay-700">
                <Star className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-4xl md:text-5xl font-bold text-white mb-3 group-hover:text-orange-300 transition-colors duration-300">4.9/5</h3>
              <p className="text-white/80 text-lg font-medium group-hover:text-white transition-colors duration-300">⭐ Note Utilisateurs</p>
            </div>
          </div>
        </div>

        {/* Enhanced CTA Section */}
        <div className="text-center animate-fade-in">
          <Card className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white border-0 shadow-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 animate-pulse"></div>
            <CardContent className="p-10 md:p-16 relative z-10">
              <div className="mb-8">
                <div className="text-6xl mb-4 animate-bounce-gentle">🚀</div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 animate-scale-in">
                  Prêt à commencer ?
                </h2>
                <p className="text-2xl mb-10 text-blue-100 font-light animate-slide-up">
                  Rejoignez des milliers d'utilisateurs qui font confiance à SendFlow pour leurs transferts d'argent.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center animate-scale-in">
                <Button 
                  onClick={() => navigate('/auth')}
                  size="xl"
                  className="bg-white text-indigo-600 hover:bg-gray-100 hover:text-indigo-700 font-bold px-12 py-6 h-16 text-xl shadow-2xl hover:shadow-white/25 transform hover:-translate-y-2 hover:scale-110 transition-all duration-300 rounded-2xl"
                >
                  <Award className="mr-3 h-7 w-7" />
                  🎯 Créer un compte
                  <ArrowRight className="ml-3 h-7 w-7" />
                </Button>
                
                <Button 
                  onClick={() => navigate('/agent-auth')}
                  variant="outline"
                  size="xl"
                  className="border-3 border-white text-white hover:bg-white hover:text-indigo-600 font-bold px-12 py-6 h-16 text-xl shadow-2xl hover:shadow-white/25 transform hover:-translate-y-2 hover:scale-110 transition-all duration-300 rounded-2xl backdrop-blur-sm"
                >
                  <Crown className="mr-3 h-7 w-7" />
                  👑 Devenir Agent
                  <Shield className="ml-3 h-7 w-7" />
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
