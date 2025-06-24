
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface ProfileData {
  id: string;
  full_name: string;
  phone: string;
  avatar_url?: string;
  id_card_number?: string;
  id_card_photo_url?: string;
}

export const useProfileForm = (profile: ProfileData) => {
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [idCardNumber, setIdCardNumber] = useState(profile?.id_card_number || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile?.avatar_url || null);
  const [idCardPreviewUrl, setIdCardPreviewUrl] = useState<string | null>(profile?.id_card_photo_url || null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const ensureBucketsExist = async () => {
    try {
      const { data: avatarBucket } = await supabase.storage.getBucket('avatars');
      if (!avatarBucket) {
        console.log('Création du bucket avatars...');
        await supabase.storage.createBucket('avatars', {
          public: true,
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
          fileSizeLimit: 2097152
        });
      }

      const { data: idCardBucket } = await supabase.storage.getBucket('id-cards');
      if (!idCardBucket) {
        console.log('Création du bucket id-cards...');
        await supabase.storage.createBucket('id-cards', {
          public: false,
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
          fileSizeLimit: 5242880
        });
      }
    } catch (error) {
      console.log('Les buckets existent déjà ou erreur lors de la création:', error);
    }
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
      
      await ensureBucketsExist();

      const updates: any = { 
        full_name: fullName.trim(),
        id_card_number: idCardNumber.trim() || null
      };
      
      if (avatarFile) {
        console.log('Upload de l\'avatar...');
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
        
        const avatarUrl = await uploadFile(avatarFile, 'avatars', fileName);
        updates.avatar_url = avatarUrl;
        console.log('Avatar uploadé:', avatarUrl);
      }

      if (idCardFile) {
        console.log('Upload de la photo d\'identité...');
        const fileExt = idCardFile.name.split('.').pop();
        const fileName = `${profile.id}/id-card-${Date.now()}.${fileExt}`;
        
        const idCardUrl = await uploadFile(idCardFile, 'id-cards', fileName);
        updates.id_card_photo_url = idCardUrl;
        console.log('Photo d\'identité uploadée:', idCardUrl);
      }

      console.log('Mise à jour des données du profil...', updates);

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

  return {
    fullName,
    setFullName,
    idCardNumber,
    setIdCardNumber,
    avatarFile,
    setAvatarFile,
    idCardFile,
    setIdCardFile,
    isUploading,
    previewUrl,
    setPreviewUrl,
    idCardPreviewUrl,
    setIdCardPreviewUrl,
    handleSubmit,
    toast
  };
};
