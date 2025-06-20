
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

  const ensureBucketsExist = async () => {
    try {
      // Vérifier et créer le bucket avatars
      const { data: avatarBucket } = await supabase.storage.getBucket('avatars');
      if (!avatarBucket) {
        console.log('Création du bucket avatars...');
        await supabase.storage.createBucket('avatars', {
          public: true,
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
          fileSizeLimit: 2097152 // 2MB
        });
      }

      // Vérifier et créer le bucket id-cards
      const { data: idCardBucket } = await supabase.storage.getBucket('id-cards');
      if (!idCardBucket) {
        console.log('Création du bucket id-cards...');
        await supabase.storage.createBucket('id-cards', {
          public: false,
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
          fileSizeLimit: 5242880 // 5MB
        });
      }
    } catch (error) {
      console.log('Les buckets existent déjà ou erreur lors de la création:', error);
    }
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

  const uploadFile = async (file: File, bucket: string, path: string) => {
    try {
      console.log(`Upload du fichier vers ${bucket}/${path}`);
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Erreur upload:', error);
        throw error;
      }

      console.log('Upload réussi:', data);

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return urlData.publicUrl;
    } catch (error) {
      console.error(`Erreur lors de l'upload vers ${bucket}:`, error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom complet est requis",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      console.log('Début de la mise à jour du profil...');
      
      // S'assurer que les buckets existent
      await ensureBucketsExist();

      const updates: any = { 
        full_name: fullName.trim(),
        id_card_number: idCardNumber.trim() || null
      };
      
      // Upload avatar si un nouveau fichier a été sélectionné
      if (avatarFile) {
        console.log('Upload de l\'avatar...');
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
        
        const avatarUrl = await uploadFile(avatarFile, 'avatars', fileName);
        updates.avatar_url = avatarUrl;
        console.log('Avatar uploadé:', avatarUrl);
      }

      // Upload photo d'identité si un nouveau fichier a été sélectionné
      if (idCardFile) {
        console.log('Upload de la photo d\'identité...');
        const fileExt = idCardFile.name.split('.').pop();
        const fileName = `${profile.id}/id-card-${Date.now()}.${fileExt}`;
        
        const idCardUrl = await uploadFile(idCardFile, 'id-cards', fileName);
        updates.id_card_photo_url = idCardUrl;
        console.log('Photo d\'identité uploadée:', idCardUrl);
      }

      console.log('Mise à jour des données du profil...', updates);

      // Mettre à jour le profil utilisateur
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id);

      if (error) {
        console.error('Erreur lors de la mise à jour:', error);
        throw error;
      }

      console.log('Profil mis à jour avec succès');

      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été mises à jour avec succès"
      });

      // Invalider les requêtes pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
    } catch (error) {
      console.error('Erreur complète:', error);
      
      let errorMessage = "Impossible de mettre à jour votre profil";
      
      if (error instanceof Error) {
        if (error.message.includes('storage')) {
          errorMessage = "Erreur lors de l'upload des fichiers";
        } else if (error.message.includes('profiles')) {
          errorMessage = "Erreur lors de la sauvegarde des informations";
        } else if (error.message.includes('permission')) {
          errorMessage = "Permissions insuffisantes";
        }
      }
      
      toast({
        title: "Erreur",
        description: errorMessage + ". Veuillez réessayer.",
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
        <Label htmlFor="fullName">Nom complet *</Label>
        <Input 
          id="fullName"
          type="text" 
          value={fullName} 
          onChange={(e) => setFullName(e.target.value)} 
          placeholder="Votre nom complet"
          required
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
