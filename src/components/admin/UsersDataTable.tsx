
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/integrations/supabase/client';
import { Eye, UserCheck, Ban, Shield, User } from 'lucide-react';

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
  onQuickRoleChange: (userId: string, newRole: string) => void;
  onQuickBanToggle: (userId: string, currentBanStatus: boolean) => void;
}

const UsersDataTable = ({ users, onViewUser, onQuickRoleChange, onQuickBanToggle }: UsersDataTableProps) => {
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
      case 'admin': return <Shield className="w-3 h-3" />;
      case 'sub_admin': return <UserCheck className="w-3 h-3" />;
      case 'agent': return <UserCheck className="w-3 h-3" />;
      default: return <User className="w-3 h-3" />;
    }
  };

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
                <div className="flex gap-2">
                  {/* Actions de changement de rôle */}
                  {user.role === 'user' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onQuickRoleChange(user.id, 'agent')}
                        className="text-xs"
                      >
                        → Agent
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onQuickRoleChange(user.id, 'sub_admin')}
                        className="text-xs"
                      >
                        → Sous-Admin
                      </Button>
                    </>
                  )}
                  {user.role === 'agent' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onQuickRoleChange(user.id, 'user')}
                        className="text-xs"
                      >
                        → Utilisateur
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onQuickRoleChange(user.id, 'sub_admin')}
                        className="text-xs"
                      >
                        → Sous-Admin
                      </Button>
                    </>
                  )}
                  {user.role === 'sub_admin' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onQuickRoleChange(user.id, 'user')}
                        className="text-xs"
                      >
                        → Utilisateur
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onQuickRoleChange(user.id, 'agent')}
                        className="text-xs"
                      >
                        → Agent
                      </Button>
                    </>
                  )}
                  
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
