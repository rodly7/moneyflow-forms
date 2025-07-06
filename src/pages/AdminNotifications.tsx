
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Send, ArrowLeft, Bell } from "lucide-react";

const AdminNotifications = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target_role: '',
    target_country: '',
    priority: 'normal'
  });

  const predefinedMessages = [
    {
      title: "Mise à jour système",
      message: "Nous avons déployé une nouvelle mise à jour pour améliorer les performances de l'application. Redémarrez l'application pour bénéficier des améliorations."
    },
    {
      title: "Correction de bugs",
      message: "Des corrections importantes ont été apportées pour résoudre les problèmes de connexion et d'affichage. Merci de votre patience."
    },
    {
      title: "Maintenance programmée",
      message: "Une maintenance de routine aura lieu ce soir de 23h à 1h. Certaines fonctionnalités pourraient être temporairement indisponibles."
    },
    {
      title: "Nouvelle fonctionnalité",
      message: "Découvrez notre nouvelle interface utilisateur améliorée ! Plus intuitive et plus rapide que jamais."
    },
    {
      title: "Problème résolu",
      message: "Le problème de synchronisation des données a été résolu. Toutes vos transactions sont maintenant à jour."
    },
    {
      title: "Sécurité renforcée",
      message: "Nous avons renforcé la sécurité de nos serveurs. Votre argent et vos données sont encore mieux protégés."
    }
  ];

  const countries = ["Sénégal", "Mali", "Burkina Faso", "Côte d'Ivoire", "Niger", "Guinée", "Mauritanie", "Togo"];

  const generateRandomMessage = () => {
    const randomMessage = predefinedMessages[Math.floor(Math.random() * predefinedMessages.length)];
    const randomCountry = countries[Math.floor(Math.random() * countries.length)];
    
    setFormData(prev => ({
      ...prev,
      title: randomMessage.title,
      message: randomMessage.message,
      target_country: randomCountry,
      target_role: ''
    }));
  };

  useEffect(() => {
    if (profile?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
  }, [profile, navigate]);

  const handleSendNotification = async () => {
    if (!formData.title || !formData.message) {
      toast({
        title: "Erreur",
        description: "Le titre et le message sont obligatoires",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Déterminer le type de notification basé sur les cibles
      let notificationType = 'all';
      if (formData.target_role && formData.target_role !== '') {
        notificationType = 'role';
      } else if (formData.target_country && formData.target_country !== '') {
        notificationType = 'country';
      }

      const { error } = await supabase
        .from('notifications')
        .insert({
          title: formData.title,
          message: formData.message,
          target_role: formData.target_role || null,
          target_country: formData.target_country || null,
          priority: formData.priority,
          notification_type: notificationType,
          sent_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Notification envoyée",
        description: "La notification a été envoyée avec succès"
      });

      setFormData({
        title: '',
        message: '',
        target_role: '',
        target_country: '',
        priority: 'normal'
      });
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'envoi de la notification",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile || profile.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/main-admin')}
              className="hover:bg-white/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Gestion des Notifications
            </h1>
          </div>
        </div>

        {/* Notification Form */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Envoyer une Notification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Titre</label>
              <Input
                placeholder="Titre de la notification"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Message</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateRandomMessage}
                  className="text-xs"
                >
                  Message aléatoire
                </Button>
              </div>
              <Textarea
                placeholder="Contenu de la notification"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({...prev, message: e.target.value}))}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rôle cible (optionnel)</label>
                <select 
                  value={formData.target_role} 
                  onChange={(e) => setFormData(prev => ({...prev, target_role: e.target.value}))}
                  className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Tous les rôles</option>
                  <option value="user">Utilisateurs</option>
                  <option value="agent">Agents</option>
                  <option value="sub_admin">Sous-Administrateurs</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Pays cible (optionnel)</label>
                <select
                  value={formData.target_country}
                  onChange={(e) => setFormData(prev => ({...prev, target_country: e.target.value}))}
                  className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">Tous les pays</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Priorité</label>
                <select 
                  value={formData.priority} 
                  onChange={(e) => setFormData(prev => ({...prev, priority: e.target.value}))}
                  className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="low">Faible</option>
                  <option value="normal">Normale</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Élevée</option>
                </select>
              </div>
            </div>

            <Button 
              onClick={handleSendNotification}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Send className="w-4 h-4 mr-2" />
              {isLoading ? 'Envoi en cours...' : 'Envoyer la notification'}
            </Button>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-800 mb-2">Information</h3>
                <div className="space-y-1 text-sm text-blue-700">
                  <p>• Les notifications sont envoyées à tous les utilisateurs par défaut</p>
                  <p>• Vous pouvez cibler un rôle spécifique ou un pays</p>
                  <p>• Les notifications avec une priorité élevée apparaissent en premier</p>
                  <p>• Tous les utilisateurs peuvent voir les notifications dans leur tableau de bord</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminNotifications;
