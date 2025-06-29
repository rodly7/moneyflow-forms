
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Star, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const UserProfileInfo = () => {
  const { profile } = useAuth();

  if (!profile) return null;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4" />;
      case 'sub_admin':
        return <Shield className="w-4 h-4" />;
      case 'agent':
        return <Star className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrateur';
      case 'sub_admin':
        return 'Sous-Administrateur';
      case 'agent':
        return 'Agent';
      default:
        return 'Utilisateur';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-gradient-to-r from-purple-600 to-pink-600';
      case 'sub_admin':
        return 'bg-gradient-to-r from-blue-600 to-indigo-600';
      case 'agent':
        return 'bg-gradient-to-r from-emerald-600 to-teal-600';
      default:
        return 'bg-gradient-to-r from-gray-600 to-gray-700';
    }
  };

  return (
    <Card className="mb-6 bg-white/90 backdrop-blur-sm shadow-xl border-0">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Avatar className="h-16 w-16 md:h-20 md:w-20">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg font-bold">
              {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                {profile.full_name || 'Utilisateur'}
              </h2>
              <Badge className={`${getRoleColor(profile.role)} text-white border-0 text-sm`}>
                {getRoleIcon(profile.role)}
                <span className="ml-1">{getRoleLabel(profile.role)}</span>
              </Badge>
            </div>
            
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Téléphone:</strong> {profile.phone}</p>
              <p><strong>Pays:</strong> {profile.country || 'Non spécifié'}</p>
              {profile.is_verified && (
                <p className="text-green-600"><strong>✓ Compte vérifié</strong></p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfileInfo;
