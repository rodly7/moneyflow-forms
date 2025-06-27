
import { Button } from "@/components/ui/button";
import { useProfileForm } from "@/hooks/useProfileForm";
import AvatarUploadSection from "@/components/profile/AvatarUploadSection";
import IdCardUploadSection from "@/components/profile/IdCardUploadSection";
import ProfileFormFields from "@/components/profile/ProfileFormFields";

interface ProfileEditFormProps {
  profile: {
    id: string;
    full_name: string;
    phone: string;
    avatar_url?: string;
    id_card_photo_url?: string;
  };
}

const ProfileEditForm = ({ profile }: ProfileEditFormProps) => {
  const {
    fullName,
    setFullName,
    isUploading,
    previewUrl,
    setPreviewUrl,
    idCardPreviewUrl,
    setIdCardPreviewUrl,
    setAvatarFile,
    setIdCardFile,
    handleSubmit,
    toast
  } = useProfileForm(profile);

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      <AvatarUploadSection 
        previewUrl={previewUrl}
        fullName={fullName}
        onFileChange={handleFileChange}
      />
      
      <ProfileFormFields 
        fullName={fullName}
        setFullName={setFullName}
        phone={profile?.phone}
      />

      <IdCardUploadSection 
        idCardPreviewUrl={idCardPreviewUrl}
        onFileChange={handleIdCardFileChange}
      />
      
      <Button type="submit" className="w-full" disabled={isUploading}>
        {isUploading ? "Mise à jour..." : "Enregistrer les modifications"}
      </Button>
    </form>
  );
};

export default ProfileEditForm;
