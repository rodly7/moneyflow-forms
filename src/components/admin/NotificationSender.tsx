
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Send, Users, Bell, AlertCircle, CheckCircle, Loader } from "lucide-react";

interface User {
  id: string;
  full_name: string;
  phone: string;
  role: string;
  country: string;
}

const NotificationSender = () => {
  const [notificationType, setNotificationType] = useState<'all' | 'role' | 'country' | 'individual'>('all');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users-for-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, role, country')
        .order('full_name');

      if (error) throw error;
      return data as User[];
    },
  });

  const { data: countries } = useQuery({
    queryKey: ['countries-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('country')
        .not('country', 'is', null);

      if (error) throw error;
      const uniqueCountries = [...new Set(data.map(item => item.country))];
      return uniqueCountries.filter(Boolean);
    },
  });

  const getFilteredUsers = () => {
    if (!users) return [];

    switch (notificationType) {
      case 'role':
        return users.filter(user => user.role === selectedRole);
      case 'country':
        return users.filter(user => user.country === selectedCountry);
      case 'individual':
        return users.filter(user => selectedUsers.includes(user.id));
      default:
        return users;
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSendNotification = async () => {
    if (!title || !message) {
      toast({
        title: "Données manquantes",
        description: "Veuillez remplir le titre et le message",
        variant: "destructive"
      });
      return;
    }

    const targetUsers = getFilteredUsers();
    if (targetUsers.length === 0) {
      toast({
        title: "Aucun destinataire",
        description: "Aucun utilisateur sélectionné pour recevoir la notification",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);

    try {
      // Créer la notification dans la base de données
      const { data: notification, error: notificationError } = await supabase
        .from('notifications')
        .insert({
          title,
          message,
          priority,
          notification_type: notificationType,
          target_role: selectedRole || null,
          target_country: selectedCountry || null,
          target_users: notificationType === 'individual' ? selectedUsers : null,
          sent_by: (await supabase.auth.getUser()).data.user?.id,
          total_recipients: targetUsers.length
        })
        .select()
        .single();

      if (notificationError) throw notificationError;

      // Envoyer les notifications individuelles
      const individualNotifications = targetUsers.map(user => ({
        notification_id: notification.id,
        user_id: user.id,
        status: 'sent'
      }));

      const { error: recipientError } = await supabase
        .from('notification_recipients')
        .insert(individualNotifications);

      if (recipientError) throw recipientError;

      toast({
        title: "Notification envoyée",
        description: `Notification envoyée à ${targetUsers.length} utilisateurs`,
      });

      // Reset form
      setTitle('');
      setMessage('');
      setPriority('normal');
      setSelectedUsers([]);
      setSelectedRole('');
      setSelectedCountry('');
      setNotificationType('all');

    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'envoi de la notification",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const filteredUsers = getFilteredUsers();

  if (isLoading) {
    return (
      <Card className="backdrop-blur-xl bg-white/90 shadow-2xl border border-white/50 rounded-2xl">
        <CardContent className="p-8 text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement des utilisateurs...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="backdrop-blur-xl bg-white/90 shadow-2xl border border-white/50 rounded-2xl">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-2xl">
          <CardTitle className="flex items-center gap-3 text-purple-700">
            <Send className="w-6 h-6" />
            Envoyer des Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Configuration du message */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-700 font-medium">
                  Titre de la notification
                </Label>
                <Input
                  id="title"
                  placeholder="Titre de votre notification"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-12 bg-gray-50 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-gray-700 font-medium">
                  Priorité
                </Label>
                <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                  <SelectTrigger className="h-12 bg-gray-50 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🟢 Faible</SelectItem>
                    <SelectItem value="normal">🟡 Normal</SelectItem>
                    <SelectItem value="high">🔴 Élevée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-gray-700 font-medium">
                Message
              </Label>
              <Textarea
                id="message"
                placeholder="Contenu de votre notification..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="bg-gray-50 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Sélection des destinataires */}
          <div className="space-y-4">
            <Label className="text-gray-700 font-medium text-lg">
              Destinataires
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Button
                variant={notificationType === 'all' ? 'default' : 'outline'}
                onClick={() => setNotificationType('all')}
                className="justify-start rounded-full"
              >
                <Users className="w-4 h-4 mr-2" />
                Tous
              </Button>
              <Button
                variant={notificationType === 'role' ? 'default' : 'outline'}
                onClick={() => setNotificationType('role')}
                className="justify-start rounded-full"
              >
                <Bell className="w-4 h-4 mr-2" />
                Par rôle
              </Button>
              <Button
                variant={notificationType === 'country' ? 'default' : 'outline'}
                onClick={() => setNotificationType('country')}
                className="justify-start rounded-full"
              >
                🌍 Par pays
              </Button>
              <Button
                variant={notificationType === 'individual' ? 'default' : 'outline'}
                onClick={() => setNotificationType('individual')}
                className="justify-start rounded-full"
              >
                👤 Individuel
              </Button>
            </div>

            {/* Filtres conditionnels */}
            {notificationType === 'role' && (
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="h-12 bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Utilisateurs</SelectItem>
                  <SelectItem value="agent">Agents</SelectItem>
                  <SelectItem value="admin">Administrateurs</SelectItem>
                  <SelectItem value="sub_admin">Sous-Administrateurs</SelectItem>
                </SelectContent>
              </Select>
            )}

            {notificationType === 'country' && (
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="h-12 bg-gray-50 border-gray-200">
                  <SelectValue placeholder="Sélectionner un pays" />
                </SelectTrigger>
                <SelectContent>
                  {countries?.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {notificationType === 'individual' && (
              <div className="max-h-64 overflow-y-auto space-y-2 bg-gray-50 rounded-xl p-4">
                {users?.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => handleUserToggle(user.id)}
                        className="w-5 h-5"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{user.full_name}</p>
                        <p className="text-sm text-gray-600">{user.phone} • {user.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Aperçu des destinataires */}
          {filteredUsers.length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-purple-900 mb-2">
                    Aperçu de l'envoi
                  </h4>
                  <p className="text-sm text-purple-700">
                    Cette notification sera envoyée à <strong>{filteredUsers.length}</strong> utilisateur(s)
                  </p>
                  {notificationType === 'role' && selectedRole && (
                    <p className="text-sm text-purple-600">Rôle: {selectedRole}</p>
                  )}
                  {notificationType === 'country' && selectedCountry && (
                    <p className="text-sm text-purple-600">Pays: {selectedCountry}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setTitle('');
                setMessage('');
                setPriority('normal');
                setSelectedUsers([]);
                setSelectedRole('');
                setSelectedCountry('');
                setNotificationType('all');
              }}
              disabled={isSending}
              className="rounded-full px-6"
            >
              Réinitialiser
            </Button>
            <Button
              onClick={handleSendNotification}
              disabled={isSending || !title || !message || filteredUsers.length === 0}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full px-8"
            >
              {isSending ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer ({filteredUsers.length})
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSender;
