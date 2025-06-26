
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProfileEditForm from "@/components/ProfileEditForm";
import { LogOut, Star, Edit3 } from "lucide-react";
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

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const isAgent = userRole === 'agent' || userRole === 'admin';

  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-2xl overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <div className="cursor-pointer relative group">
                  <Avatar className="h-16 w-16 ring-4 ring-emerald-100 transition-all duration-300 group-hover:ring-emerald-200">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || ''} />
                    <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-lg font-bold">
                      {getInitials(profile?.full_name || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Edit3 className="h-3 w-3 text-white" />
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-gray-800">Modifier votre profil</DialogTitle>
                </DialogHeader>
                {profile && <ProfileEditForm profile={profile} />}
              </DialogContent>
            </Dialog>
            
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-800">{profile?.full_name}</h2>
                {isAgent && (
                  <div className="flex items-center bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2 py-1 rounded-full">
                    <Star className="h-3 w-3 mr-1" />
                    <span className="text-xs font-medium">Agent</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 font-medium">{profile?.phone}</p>
              <p className="text-xs text-gray-500 mt-1">Membre depuis aujourd'hui</p>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-300"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileHeader;
