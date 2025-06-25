
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/integrations/supabase/client';
import { User, Shield, Ban, UserCheck, UserX, Edit3, Trash2 } from 'lucide-react';

interface UserData {
  id: string;
  full_name: string | null;
  phone: string;
  balance: number;
  country: string | null;
  role: 'user' | 'agent' | 'admin' | 'sub_admin';
  is_banned?: boolean;
  banned_reason?: string | null;
  created_at: string;
}

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData | null;
  onUserUpdated: () => void;
}

const UserManagementModal = ({ isOpen, onClose, user, onUserUpdated }: UserManagementModalProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    country: user?.country || '',
    balance: user?.balance || 0,
    role: user?.role || 'user'
  });
  const [banData, setBanData] = useState({
    reason: user?.banned_reason || ''
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        country: user.country || '',
        balance: user.balance || 0,
        role: user.role || 'user'
      });
      setBanData({
        reason: user.banned_reason || ''
      });
    }
  }, [user]);

  const handleUpdateUser = async () => {
    if (!user) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          country: formData.country,
          role: formData.role
        })
        .eq('id', user.id);

      if (error) throw error;

      // Mettre à jour le solde si nécessaire
      if (formData.balance !== user.balance) {
        const balanceDiff = formData.balance - user.balance;
        await supabase.rpc('increment_balance', {
          user_id: user.id,
          amount: balanceDiff
        });
      }

      toast({
        title: "Utilisateur mis à jour",
        description: "Les informations ont été mises à jour avec succès"
      });

      setEditMode(false);
      onUserUpdated();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour de l'utilisateur",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBanUser = async () => {
    if (!user) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: true,
          banned_at: new Date().toISOString(),
          banned_reason: banData.reason
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Utilisateur banni",
        description: "L'utilisateur a été banni avec succès"
      });

      onUserUpdated();
    } catch (error) {
      console.error('Erreur lors du bannissement:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du bannissement de l'utilisateur",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnbanUser = async () => {
    if (!user) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: false,
          banned_at: null,
          banned_reason: null
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Utilisateur débanni",
        description: "L'accès a été rétabli avec succès"
      });

      onUserUpdated();
    } catch (error) {
      console.error('Erreur lors du débannissement:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du débannissement de l'utilisateur",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!user || !confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès"
      });

      onClose();
      onUserUpdated();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression de l'utilisateur",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'sub_admin': return 'bg-orange-100 text-orange-800';
      case 'agent': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'sub_admin': return 'Sous-Administrateur';
      case 'agent': return 'Agent';
      default: return 'Utilisateur';
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Gestion utilisateur - {user.full_name || user.phone}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informations de base */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                Informations générales
                <div className="flex items-center gap-2">
                  <Badge className={getRoleColor(user.role)}>
                    {getRoleLabel(user.role)}
                  </Badge>
                  {user.is_banned && (
                    <Badge variant="destructive">Banni</Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {editMode ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Nom complet</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({...prev, full_name: e.target.value}))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Pays</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData(prev => ({...prev, country: e.target.value}))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="balance">Solde (FCFA)</Label>
                    <Input
                      id="balance"
                      type="number"
                      value={formData.balance}
                      onChange={(e) => setFormData(prev => ({...prev, balance: Number(e.target.value)}))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Rôle</Label>
                    <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({...prev, role: value as any}))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Utilisateur</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="sub_admin">Sous-Administrateur</SelectItem>
                        <SelectItem value="admin">Administrateur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nom:</p>
                    <p className="font-medium">{user.full_name || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Téléphone:</p>
                    <p className="font-medium">{user.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pays:</p>
                    <p className="font-medium">{user.country || 'Non renseigné'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Solde:</p>
                    <p className="font-medium text-green-600">{formatCurrency(user.balance, 'XAF')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Créé le:</p>
                    <p className="font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions principales */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {editMode ? (
                  <>
                    <Button onClick={handleUpdateUser} disabled={isProcessing}>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Sauvegarder
                    </Button>
                    <Button variant="outline" onClick={() => setEditMode(false)}>
                      Annuler
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setEditMode(true)} variant="outline">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                )}

                {user.is_banned ? (
                  <Button onClick={handleUnbanUser} disabled={isProcessing} variant="outline">
                    <UserCheck className="w-4 h-4 mr-2" />
                    Débannir
                  </Button>
                ) : (
                  <Button onClick={handleBanUser} disabled={isProcessing} variant="destructive">
                    <Ban className="w-4 h-4 mr-2" />
                    Bannir
                  </Button>
                )}

                <Button onClick={handleDeleteUser} disabled={isProcessing} variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Gestion du bannissement */}
          {!user.is_banned && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Raison du bannissement (optionnel)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Raison du bannissement..."
                  value={banData.reason}
                  onChange={(e) => setBanData(prev => ({...prev, reason: e.target.value}))}
                />
              </CardContent>
            </Card>
          )}

          {/* Informations de bannissement */}
          {user.is_banned && user.banned_reason && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-red-600">Raison du bannissement</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{user.banned_reason}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserManagementModal;
