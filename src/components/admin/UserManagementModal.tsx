import React, { useState } from 'react';
// Removed Dialog import - using native HTML instead
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/integrations/supabase/client';
import { User, Shield, Ban, UserCheck, UserX, Edit3, Trash2, Crown, Eye } from 'lucide-react';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

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
  isSubAdmin?: boolean;
}

const UserManagementModal = ({ isOpen, onClose, user, onUserUpdated, isSubAdmin = false }: UserManagementModalProps) => {
  const { toast } = useToast();
  const deviceInfo = useDeviceDetection();
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
      case 'admin': return 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg';
      case 'sub_admin': return 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg';
      case 'agent': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg';
      default: return 'bg-gradient-to-r from-slate-500 to-gray-500 text-white shadow-lg';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return '👑 Administrateur';
      case 'sub_admin': return '🛡️ Sous-Administrateur';
      case 'agent': return '🔧 Agent';
      default: return '👤 Utilisateur';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-5 h-5" />;
      case 'sub_admin': return <Shield className="w-5 h-5" />;
      case 'agent': return <UserCheck className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  if (!user || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Native HTML overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      ></div>
      
      {/* Native HTML modal content */}
      <div className={`relative ${deviceInfo.isMobile ? 'w-full max-w-sm mx-2' : 'w-full max-w-3xl mx-4'} max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl border-0`}>
        {/* Native HTML header */}
        <div className="bg-gradient-to-r from-violet-50/80 to-purple-50/80 p-6 rounded-t-lg border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg text-white">
                {isSubAdmin ? <Eye className="w-6 h-6" /> : <User className="w-6 h-6" />}
              </div>
              <span className={`${deviceInfo.isMobile ? 'text-lg' : 'text-xl'} bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent font-bold`}>
                {isSubAdmin ? '👀 Consultation utilisateur' : '⚙️ Gestion utilisateur'} - {user.full_name || user.phone}
              </span>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              type="button"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Native HTML content */}
        <div className="p-6 space-y-6">
          {/* Informations de base */}
          <Card className="glass border border-violet-100/50">
            <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 pb-4">
              <CardTitle className={`${deviceInfo.isMobile ? 'text-lg' : 'text-xl'} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg text-white">
                    <User className="w-5 h-5" />
                  </div>
                  📋 Informations générales
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={`${getRoleColor(user.role)} flex items-center gap-2 px-3 py-1`}>
                    {getRoleIcon(user.role)}
                    {getRoleLabel(user.role)}
                  </Badge>
                  {user.is_banned && (
                    <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg">🚫 Banni</Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className={`grid ${deviceInfo.isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-6`}>
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-sm font-semibold text-violet-600 mb-1">👤 Nom:</p>
                  <p className="font-bold text-slate-800 text-lg">{user.full_name || 'Non renseigné'}</p>
                </div>
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-sm font-semibold text-violet-600 mb-1">📱 Téléphone:</p>
                  <p className="font-bold text-slate-800 text-lg">{user.phone}</p>
                </div>
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-sm font-semibold text-violet-600 mb-1">🌍 Pays:</p>
                  <p className="font-bold text-slate-800 text-lg">{user.country || 'Non renseigné'}</p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                  <p className="text-sm font-semibold text-green-600 mb-1">💰 Solde:</p>
                  <p className="font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent text-xl">{formatCurrency(user.balance, 'XAF')}</p>
                </div>
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-sm font-semibold text-violet-600 mb-1">📅 Créé le:</p>
                  <p className="font-bold text-slate-800">{new Date(user.created_at).toLocaleDateString()}</p>
                </div>
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-xl border border-slate-200">
                  <p className="text-sm font-semibold text-violet-600 mb-1">🆔 ID Utilisateur:</p>
                  <p className="font-mono text-xs bg-violet-100 px-2 py-1 rounded border text-violet-700">{user.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations de bannissement */}
          {user.is_banned && user.banned_reason && (
            <Card className="glass border border-red-200">
              <CardHeader className="bg-gradient-to-r from-red-50/50 to-pink-50/50 pb-4">
                <CardTitle className={`${deviceInfo.isMobile ? 'text-lg' : 'text-xl'} flex items-center gap-3`}>
                  <div className="p-2 bg-red-500 rounded-lg text-white">
                    <Ban className="w-5 h-5" />
                  </div>
                  <span className="bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">🚫 Raison du bannissement</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-800 font-medium">{user.banned_reason}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions administrateur */}
          {!isSubAdmin && (
            <Card className="glass border-2 border-orange-300 bg-gradient-to-r from-orange-50/80 to-amber-50/80">
              <CardHeader className="bg-gradient-to-r from-orange-50/50 to-amber-50/50 pb-4">
                <CardTitle className={`${deviceInfo.isMobile ? 'text-lg' : 'text-xl'} flex items-center gap-3`}>
                  <div className="p-2 bg-orange-500 rounded-lg text-white">
                    <Edit3 className="w-5 h-5" />
                  </div>
                  <span className="bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">⚙️ Actions administrateur</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {!editMode ? (
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() => setEditMode(true)}
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                      disabled={isProcessing}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                    
                    {user.is_banned ? (
                      <Button
                        onClick={handleUnbanUser}
                        disabled={isProcessing}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        Débannir
                      </Button>
                    ) : (
                      <Button
                        onClick={handleBanUser}
                        disabled={isProcessing}
                        variant="destructive"
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Bannir
                      </Button>
                    )}
                    
                    <Button
                      onClick={handleDeleteUser}
                      disabled={isProcessing}
                      variant="destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-name">Nom complet</Label>
                        <Input
                          id="edit-name"
                          value={formData.full_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                          placeholder="Nom complet"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-phone">Téléphone</Label>
                        <Input
                          id="edit-phone"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="Téléphone"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-country">Pays</Label>
                        <Input
                          id="edit-country"
                          value={formData.country}
                          onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                          placeholder="Pays"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-role">Rôle</Label>
                        <select
                          id="edit-role"
                          value={formData.role}
                          onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="user">👤 Utilisateur</option>
                          <option value="agent">🔧 Agent</option>
                          <option value="sub_admin">🛡️ Sous-Admin</option>
                          <option value="admin">👑 Admin</option>
                        </select>
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-balance">Solde (XAF)</Label>
                        <Input
                          id="edit-balance"
                          type="number"
                          value={formData.balance}
                          onChange={(e) => setFormData(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
                          placeholder="Solde"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        onClick={handleUpdateUser}
                        disabled={isProcessing}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                      >
                        {isProcessing ? 'Sauvegarde...' : 'Sauvegarder'}
                      </Button>
                      
                      <Button
                        onClick={() => {
                          setEditMode(false);
                          setFormData({
                            full_name: user.full_name || '',
                            phone: user.phone || '',
                            country: user.country || '',
                            balance: user.balance || 0,
                            role: user.role || 'user'
                          });
                        }}
                        variant="outline"
                        disabled={isProcessing}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Section bannissement */}
                {!editMode && !user.is_banned && (
                  <div className="border-t pt-4 mt-4">
                    <Label htmlFor="ban-reason">Raison du bannissement (optionnel)</Label>
                    <Textarea
                      id="ban-reason"
                      value={banData.reason}
                      onChange={(e) => setBanData(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="Indiquez la raison du bannissement..."
                      rows={3}
                      className="mt-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Message d'information pour sous-admins */}
          {isSubAdmin && (
            <Card className="glass border-2 border-blue-300 bg-gradient-to-r from-blue-50/80 to-indigo-50/80">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500 rounded-xl text-white">
                    <Eye className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-800 mb-3 text-lg">👀 Mode Consultation</h3>
                    <p className="text-blue-700 bg-blue-100/50 p-3 rounded-lg">
                      🔒 En tant que sous-administrateur, vous pouvez consulter les informations des utilisateurs mais ne pouvez pas les modifier.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagementModal;
