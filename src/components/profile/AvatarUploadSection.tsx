
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface AvatarUploadSectionProps {
  previewUrl: string | null;
  fullName: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AvatarUploadSection = ({ previewUrl, fullName, onFileChange }: AvatarUploadSectionProps) => {
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
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
          onChange={onFileChange}
        />
      </div>
    </div>
  );
};

export default AvatarUploadSection;
