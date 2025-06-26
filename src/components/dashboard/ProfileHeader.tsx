
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProfileEditForm from "@/components/ProfileEditForm";
import { LogOut, Star, Edit3, Camera, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  full_name: string | null;
  phone: string;
  avatar_url?: string | null;
}

interface ProfileHeaderProps {
  profile: Profile;
}

const ProfileHeader = ({ profile }: ProfileHeaderProps) => {
  const { signOut, user, userRole } = useAuth();
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const isAgent = userRole === 'agent' || userRole === 'admin';

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0 rounded-3xl overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Dialog>
              <DialogTrigger asChild>
                <div className="cursor-pointer relative group">
                  <Avatar className="h-20 w-20 ring-4 ring-emerald-100 transition-all duration-300 group-hover:ring-emerald-200 group-hover:scale-105">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || ''} />
                    <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xl font-bold">
                      {profile?.avatar_url ? (
                        getInitials(profile?.full_name || '')
                      ) : (
                        <User className="h-8 w-8" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg">
                    {profile?.avatar_url ? (
                      <Edit3 className="h-4 w-4 text-white" />
                    ) : (
                      <Camera className="h-4 w-4 text-white" />
                    )}
                  </div>
                  {!profile?.avatar_url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-white text-xs font-medium">Ajouter</span>
                    </div>
                  )}
                </div>
              </DialogTrigger>
              <DialogContent className="rounded-2xl max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Camera className="h-5 w-5 text-emerald-600" />
                    Modifier votre profil
                  </DialogTitle>
                </DialogHeader>
                {profile && <ProfileEditForm profile={profile} />}
              </DialogContent>
            </Dialog>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold text-gray-800">{profile?.full_name || 'Utilisateur'}</h2>
                {isAgent && (
                  <div className="flex items-center bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1 rounded-full shadow-md">
                    <Star className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Agent</span>
                  </div>
                )}
              </div>
              <p className="text-base text-gray-600 font-medium mb-1">{profile?.phone}</p>
              <p className="text-sm text-gray-500">Membre depuis aujourd'hui</p>
              {!profile?.avatar_url && (
                <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
                  <Camera className="h-3 w-3" />
                  Cliquez sur l'avatar pour ajouter une photo
                </p>
              )}
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-300 h-12 w-12"
            onClick={handleLogout}
          >
            <LogOut className="w-6 h-6" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileHeader;
