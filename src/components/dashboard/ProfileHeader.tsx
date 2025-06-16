
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProfileEditForm from "@/components/ProfileEditForm";
import { LogOut, Star } from "lucide-react";
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
    <Card className="bg-white shadow-lg w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <div className="cursor-pointer">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || ''} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-600">
                      {getInitials(profile?.full_name || '')}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Modifier votre profil</DialogTitle>
                </DialogHeader>
                {profile && <ProfileEditForm profile={profile} />}
              </DialogContent>
            </Dialog>
            <div>
              <div className="flex items-center">
                <h2 className="text-lg font-semibold">{profile?.full_name}</h2>
                {isAgent && (
                  <Star className="h-4 w-4 ml-1 text-amber-500 fill-amber-500" />
                )}
              </div>
              <p className="text-xs text-gray-500">{profile?.phone}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-gray-500 hover:text-gray-700"
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
