
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, FileText } from "lucide-react";

interface ProfileEditFormProps {
  profile: {
    id: string;
    full_name: string;
    phone: string;
    avatar_url?: string;
    id_card_number?: string;
    id_card_photo_url?: string;
  };
}

const ProfileEditForm = ({ profile }: ProfileEditFormProps) => {
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [idCardNumber, setIdCardNumber] = useState(profile?.id_card_number || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile?.avatar_url || null);
  const [idCardPreviewUrl, setIdCardPreviewUrl] = useState<string | null>(profile?.id_card_photo_url || null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "L'image ne doit pas dépasser 2 Mo",
        variant: "destructive"
      });
      return;
    }

    setAvatarFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleIdCardFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "La photo de la pièce d'identité ne doit pas dépasser 5 Mo",
        variant: "destructive"
      });
      return;
    }

    setIdCardFile(file);
    const objectUrl = URL.createObjectURL(file);
    setIdCardPreviewUrl(objectUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const updates: any = { 
        full_name: fullName,
        id_card_number: idCardNumber
      };
      
      // Upload avatar if a new file was selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
        
        // Create the storage bucket if it doesn't exist
        const { data: bucketData, error: bucketError } = await supabase
          .storage
          .getBucket('avatars');

        if (bucketError && bucketError.message.includes('not found')) {
          await supabase.storage.createBucket('avatars', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif'],
            fileSizeLimit: 2097152 // 2MB
          });
        }
        
        // Upload the file
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        // Add avatar URL to updates
        updates.avatar_url = urlData.publicUrl;
      }

      // Upload ID card photo if a new file was selected
      if (idCardFile) {
        const fileExt = idCardFile.name.split('.').pop();
        const fileName = `${profile.id}/id-card-${Date.now()}.${fileExt}`;
        
        // Upload the file
        const { data, error } = await supabase.storage
          .from('id-cards')
          .upload(fileName, idCardFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('id-cards')
          .getPublicUrl(fileName);

        // Add ID card photo URL to updates
        updates.id_card_photo_url = urlData.publicUrl;
      }

      // Update user profile
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été mises à jour avec succès"
      });

      // Invalidate profile query to refresh data
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre profil",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      <div className="flex flex-col items-center space-y-2">
        <Avatar className="h-24 w-24">
          <AvatarImage src={previewUrl || ""} alt={fullName} />
          <AvatarFallback className="bg-emerald-100 text-emerald-600 text-xl">
            {getInitials(fullName)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex items-center justify-center">
          <Label htmlFor="avatar" className="cursor-pointer bg-primary text-white px-3 py-1 rounded-md text-sm hover:bg-primary/90">
            Changer la photo
          </Label>
          <Input 
            id="avatar" 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileChange}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="fullName">Nom complet</Label>
        <Input 
          id="fullName"
          type="text" 
          value={fullName} 
          onChange={(e) => setFullName(e.target.value)} 
          placeholder="Votre nom complet"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="idCardNumber">Numéro de pièce d'identité</Label>
        <Input 
          id="idCardNumber"
          type="text" 
          value={idCardNumber} 
          onChange={(e) => setIdCardNumber(e.target.value)} 
          placeholder="Numéro de votre pièce d'identité"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="idCardPhoto">Photo de la pièce d'identité</Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          {idCardPreviewUrl ? (
            <div className="space-y-2">
              <img 
                src={idCardPreviewUrl} 
                alt="Pièce d'identité" 
                className="w-full h-32 object-cover rounded-md"
              />
              <div className="flex items-center justify-center">
                <Label htmlFor="idCardPhoto" className="cursor-pointer bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm hover:bg-secondary/90 flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Changer la photo
                </Label>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4">
              <FileText className="h-8 w-8 text-gray-400 mb-2" />
              <Label htmlFor="idCardPhoto" className="cursor-pointer bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm hover:bg-secondary/90 flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Ajouter une photo
              </Label>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG jusqu'à 5MB</p>
            </div>
          )}
          <Input 
            id="idCardPhoto" 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleIdCardFileChange}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Téléphone</Label>
        <Input 
          id="phone"
          type="text" 
          value={profile?.phone || ""} 
          disabled
          className="bg-gray-100"
        />
        <p className="text-xs text-gray-500">Le numéro de téléphone ne peut pas être modifié</p>
      </div>
      
      <Button type="submit" className="w-full" disabled={isUploading}>
        {isUploading ? "Mise à jour..." : "Enregistrer les modifications"}
      </Button>
    </form>
  );
};

export default ProfileEditForm;
