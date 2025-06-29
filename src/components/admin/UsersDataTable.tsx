import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/integrations/supabase/client';
import { Eye, UserCheck, Ban, Shield, User, Crown } from 'lucide-react';
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

interface UsersDataTableProps {
  users: UserData[];
  onViewUser: (user: UserData) => void;
  onQuickRoleChange: (userId: string, newRole: 'user' | 'agent' | 'admin' | 'sub_admin') => void;
  onQuickBanToggle: (userId: string, currentBanStatus: boolean) => void;
}

const UsersDataTable = ({ users, onViewUser, onQuickRoleChange, onQuickBanToggle }: UsersDataTableProps) => {
  const deviceInfo = useDeviceDetection();

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
      case 'admin': return 'Admin';
      case 'sub_admin': return 'Sous-Admin';
      case 'agent': return 'Agent';
      default: return 'Utilisateur';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-3 h-3" />;
      case 'sub_admin': return <Shield className="w-3 h-3" />;
      case 'agent': return <UserCheck className="w-3 h-3" />;
      default: return <User className="w-3 h-3" />;
    }
  };

  const getRoleChangeButtons = (user: UserData) => {
    const buttons = [];
    
    // Actions selon le rôle actuel
    if (user.role === 'user') {
      buttons.push(
        <Button key="agent" size="sm" variant="outline" onClick={() => onQuickRoleChange(user.id, 'agent')} className="text-xs">
          → Agent
        </Button>,
        <Button key="sub_admin" size="sm" variant="outline" onClick={() => onQuickRoleChange(user.id, 'sub_admin')} className="text-xs">
          → Sous-Admin
        </Button>,
        <Button key="admin" size="sm" variant="outline" onClick={() => onQuickRoleChange(user.id, 'admin')} className="text-xs bg-red-50 text-red-700 hover:bg-red-100">
          → Admin
        </Button>
      );
    }
    
    if (user.role === 'agent') {
      buttons.push(
        <Button key="user" size="sm" variant="outline" onClick={() => onQuickRoleChange(user.id, 'user')} className="text-xs">
          → Utilisateur
        </Button>,
        <Button key="sub_admin" size="sm" variant="outline" onClick={() => onQuickRoleChange(user.id, 'sub_admin')} className="text-xs">
          → Sous-Admin
        </Button>,
        <Button key="admin" size="sm" variant="outline" onClick={() => onQuickRoleChange(user.id, 'admin')} className="text-xs bg-red-50 text-red-700 hover:bg-red-100">
          → Admin
        </Button>
      );
    }
    
    if (user.role === 'sub_admin') {
      buttons.push(
        <Button key="user" size="sm" variant="outline" onClick={() => onQuickRoleChange(user.id, 'user')} className="text-xs">
          → Utilisateur
        </Button>,
        <Button key="agent" size="sm" variant="outline" onClick={() => onQuickRoleChange(user.id, 'agent')} className="text-xs">
          → Agent
        </Button>,
        <Button key="admin" size="sm" variant="outline" onClick={() => onQuickRoleChange(user.id, 'admin')} className="text-xs bg-red-50 text-red-700 hover:bg-red-100">
          → Admin
        </Button>
      );
    }

    if (user.role === 'admin') {
      buttons.push(
        <Button key="user" size="sm" variant="outline" onClick={() => onQuickRoleChange(user.id, 'user')} className="text-xs">
          → Utilisateur
        </Button>,
        <Button key="agent" size="sm" variant="outline" onClick={() => onQuickRoleChange(user.id, 'agent')} className="text-xs">
          → Agent
        </Button>,
        <Button key="sub_admin" size="sm" variant="outline" onClick={() => onQuickRoleChange(user.id, 'sub_admin')} className="text-xs">
          → Sous-Admin
        </Button>
      );
    }

    return buttons;
  };

  if (deviceInfo.isMobile) {
    // Vue mobile compacte avec cards
    return (
      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{user.full_name || 'Sans nom'}</p>
                <p className="text-sm text-gray-600">{user.phone}</p>
                <p className="text-xs text-gray-500">{user.country || 'Pays non renseigné'}</p>
              </div>
              <Badge className={`${getRoleColor(user.role)} flex items-center gap-1`}>
                {getRoleIcon(user.role)}
                {getRoleLabel(user.role)}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium text-green-600 text-sm">
                {formatCurrency(user.balance, 'XAF')}
              </span>
              {user.is_banned ? (
                <Badge variant="destructive" className="text-xs">Banni</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">Actif</Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-1 mb-2">
              {getRoleChangeButtons(user).slice(0, 2)}
            </div>
            
            <div className="flex justify-between items-center">
              <Button
                size="sm"
                variant={user.is_banned ? "outline" : "destructive"}
                onClick={() => onQuickBanToggle(user.id, user.is_banned || false)}
                className="text-xs"
              >
                {user.is_banned ? 'Débannir' : 'Bannir'}
              </Button>
              
              <Button size="sm" variant="outline" onClick={() => onViewUser(user)} className="text-xs">
                <Eye className="w-3 h-3 mr-1" />
                Voir
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Vue desktop/tablette avec table
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Utilisateur</TableHead>
            <TableHead>Téléphone</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Solde</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Actions Rapides</TableHead>
            <TableHead>Détails</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{user.full_name || 'Sans nom'}</p>
                  <p className="text-xs text-gray-500">{user.country || 'Pays non renseigné'}</p>
                </div>
              </TableCell>
              <TableCell>{user.phone}</TableCell>
              <TableCell>
                <Badge className={`${getRoleColor(user.role)} flex items-center gap-1 w-fit`}>
                  {getRoleIcon(user.role)}
                  {getRoleLabel(user.role)}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="font-medium text-green-600">
                  {formatCurrency(user.balance, 'XAF')}
                </span>
              </TableCell>
              <TableCell>
                {user.is_banned ? (
                  <Badge variant="destructive">Banni</Badge>
                ) : (
                  <Badge variant="secondary">Actif</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {getRoleChangeButtons(user)}
                  
                  {/* Action Ban/Unban */}
                  <Button
                    size="sm"
                    variant={user.is_banned ? "outline" : "destructive"}
                    onClick={() => onQuickBanToggle(user.id, user.is_banned || false)}
                    className="text-xs"
                  >
                    {user.is_banned ? (
                      <>
                        <UserCheck className="w-3 h-3 mr-1" />
                        Débannir
                      </>
                    ) : (
                      <>
                        <Ban className="w-3 h-3 mr-1" />
                        Bannir
                      </>
                    )}
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onViewUser(user)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Voir
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UsersDataTable;
