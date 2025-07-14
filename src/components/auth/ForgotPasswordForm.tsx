import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Phone, User, Lock, KeyRound, ArrowLeft } from 'lucide-react';
import { Icons } from '@/components/ui/icons';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBack }) => {
  const [step, setStep] = useState<'verify' | 'reset'>('verify');
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const normalizePhoneNumber = (phoneInput: string) => {
    // Même normalisation que dans la fonction base de données
    return phoneInput.replace(/[ -]/g, '');
  };

  const handleVerifyUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone || !fullName) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    
    try {
      const normalizedPhone = normalizePhoneNumber(phone);
      const normalizedName = fullName.trim();
      
      // Vérification robuste côté client avec la même logique que la base de données
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, phone, full_name')
        .or(`and(phone.eq.${normalizedPhone},full_name.ilike.${normalizedName})`);

      if (error) {
        throw error;
      }

      // Vérification manuelle pour plus de précision
      const matchingUser = profiles?.find(profile => {
        const dbNormalizedPhone = profile.phone.replace(/[ -]/g, '');
        const dbNormalizedName = profile.full_name?.toLowerCase().trim();
        const inputNormalizedName = normalizedName.toLowerCase();
        
        return dbNormalizedPhone === normalizedPhone && 
               dbNormalizedName === inputNormalizedName;
      });

      if (!matchingUser) {
        toast.error('Aucun compte trouvé avec ce numéro de téléphone et ce nom. Vérifiez vos informations.');
        return;
      }

      toast.success('Utilisateur vérifié! Vous pouvez maintenant définir votre nouveau mot de passe.');
      setStep('reset');
    } catch (error: any) {
      console.error('Erreur lors de la vérification:', error);
      toast.error('Erreur lors de la vérification de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      const normalizedPhone = normalizePhoneNumber(phone);
      
      // Appeler la fonction de récupération de mot de passe
      const { data, error } = await supabase.rpc('process_password_reset', {
        phone_param: normalizedPhone,
        full_name_param: fullName.trim(),
        new_password_param: newPassword
      });

      if (error) {
        throw error;
      }

      const result = data as { success: boolean; message: string };
      
      if (result.success) {
        toast.success('Mot de passe mis à jour avec succès! Vous pouvez maintenant vous connecter.');
        onBack();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error('Erreur lors de la réinitialisation:', error);
      toast.error('Erreur lors de la mise à jour du mot de passe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md backdrop-blur-2xl bg-white/10 shadow-2xl border border-white/20 rounded-3xl">
      <CardHeader className="space-y-4 text-center pb-6">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mb-4">
          <KeyRound className="w-8 h-8 text-white" />
        </div>
        
        <CardTitle className="text-2xl font-bold text-white">
          {step === 'verify' ? 'Récupération de compte' : 'Nouveau mot de passe'}
        </CardTitle>
        
        <CardDescription className="text-white/80">
          {step === 'verify' 
            ? 'Entrez votre numéro de téléphone et nom pour vérifier votre identité'
            : 'Définissez votre nouveau mot de passe'
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {step === 'verify' ? (
          <form onSubmit={handleVerifyUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white font-medium flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Numéro de téléphone
              </Label>
              <Input
                id="phone"
                type="text"
                placeholder="Ex: +242061043340"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="bg-white/15 border-white/30 text-white placeholder:text-white/60 focus:border-blue-400 focus:ring-blue-400/30"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-white font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Nom complet
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Votre nom complet"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="bg-white/15 border-white/30 text-white placeholder:text-white/60 focus:border-blue-400 focus:ring-blue-400/30"
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 rounded-xl"
              disabled={loading}
            >
              {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Vérification...' : 'Vérifier mon identité'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-white font-medium flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Nouveau mot de passe
              </Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Minimum 6 caractères"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="bg-white/15 border-white/30 text-white placeholder:text-white/60 focus:border-blue-400 focus:ring-blue-400/30"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white font-medium flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Confirmer le mot de passe
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Répétez votre mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="bg-white/15 border-white/30 text-white placeholder:text-white/60 focus:border-blue-400 focus:ring-blue-400/30"
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold py-3 rounded-xl"
              disabled={loading}
            >
              {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-white/80 hover:text-white hover:bg-white/10"
              onClick={() => setStep('verify')}
              disabled={loading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la vérification
            </Button>
          </form>
        )}

        <Button
          type="button"
          variant="ghost"
          className="w-full text-white/80 hover:text-white hover:bg-white/10 mt-4"
          onClick={onBack}
          disabled={loading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la connexion
        </Button>
      </CardContent>
    </Card>
  );
};