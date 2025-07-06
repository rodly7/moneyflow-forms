import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Edit, Trash2, Globe, Shield, User } from "lucide-react";
import InternationalDepositForm from "./InternationalDepositForm";

interface UserProfile {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  country: string;
  address: string;
  balance: number;
  role: string;
  is_verified: boolean;
  is_banned: boolean;
}

interface UserManagementActionsProps {
  user: UserProfile;
  onUserUpdated?: () => void;
  onUserDeleted?: () => void;
}

const UserManagementActions = ({ user, onUserUpdated, onUserDeleted }: UserManagementActionsProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editData, setEditData] = useState({
    full_name: user.full_name || '',
    phone: user.phone || '',
    country: user.country || '',
    address: user.address || '',
    role: user.role as 'user' | 'agent' | 'admin' | 'sub_admin' || 'user',
    is_verified: user.is_verified || false,
    is_banned: user.is_banned || false,
  });
  const { toast } = useToast();

  const handleUpdateUser = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editData.full_name,
          phone: editData.phone,
          country: editData.country,
          address: editData.address,
          role: editData.role,
          is_verified: editData.is_verified,
          is_banned: editData.is_banned,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Utilisateur mis à jour",
        description: "Les informations ont été mises à jour avec succès",
      });

      setIsEditOpen(false);
      onUserUpdated?.();
    } catch (error) {
      console.error('Erreur mise à jour utilisateur:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const handleDeleteUser = async () => {
    setIsLoading(true);
    try {
      // D'abord supprimer les données liées
      await supabase.from('transfers').delete().eq('sender_id', user.id);
      await supabase.from('withdrawals').delete().eq('user_id', user.id);
      await supabase.from('recharges').delete().eq('user_id', user.id);
      
      // Puis supprimer le profil
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès",
      });

      onUserDeleted?.();
    } catch (error) {
      console.error('Erreur suppression utilisateur:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="flex gap-2">
      {/* Dépôt International */}
      <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Globe className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dépôt International</DialogTitle>
          </DialogHeader>
          <InternationalDepositForm
            targetUserId={user.id}
            targetUserName={user.full_name || user.phone}
            onSuccess={() => {
              setIsDepositOpen(false);
              onUserUpdated?.();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Modifier Utilisateur */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Modifier l'utilisateur
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Nom complet</Label>
                <Input
                  id="full_name"
                  value={editData.full_name}
                  onChange={(e) => setEditData({...editData, full_name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={editData.phone}
                  onChange={(e) => setEditData({...editData, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country">Pays</Label>
                <Input
                  id="country"
                  value={editData.country}
                  onChange={(e) => setEditData({...editData, country: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="role">Rôle</Label>
                <Select value={editData.role} onValueChange={(value) => setEditData({...editData, role: value as 'user' | 'agent' | 'admin' | 'sub_admin'})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Utilisateur</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="sub_admin">Sous-admin</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="address">Adresse</Label>
              <Textarea
                id="address"
                value={editData.address}
                onChange={(e) => setEditData({...editData, address: e.target.value})}
                rows={2}
              />
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_verified"
                  checked={editData.is_verified}
                  onChange={(e) => setEditData({...editData, is_verified: e.target.checked})}
                />
                <Label htmlFor="is_verified">Vérifié</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_banned"
                  checked={editData.is_banned}
                  onChange={(e) => setEditData({...editData, is_banned: e.target.checked})}
                />
                <Label htmlFor="is_banned">Banni</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateUser} disabled={isLoading}>
              {isLoading ? "Mise à jour..." : "Mettre à jour"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Supprimer Utilisateur */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'utilisateur</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{user.full_name || user.phone}</strong> ?
              Cette action est irréversible et supprimera toutes les données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground"
            >
              {isLoading ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagementActions;