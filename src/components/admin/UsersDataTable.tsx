
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Shield, Ban, UserCheck, Crown, User } from 'lucide-react';
import { formatCurrency } from '@/integrations/supabase/client';
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
  isSubAdmin?: boolean;
}

const UsersDataTable = ({ 
  users, 
  onViewUser, 
  onQuickRoleChange, 
  onQuickBanToggle,
  isSubAdmin = false
}: UsersDataTableProps) => {
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

  if (deviceInfo.isMobile) {
    return (
      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge className={`${getRoleColor(user.role)} flex items-center gap-1`}>
                  {getRoleIcon(user.role)}
                  {getRoleLabel(user.role)}
                </Badge>
                {user.is_banned && (
                  <Badge variant="destructive">Banni</Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewUser(user)}
              >
                <Eye className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Nom:</span> {user.full_name || 'Non renseigné'}
              </div>
              <div>
                <span className="font-medium">Téléphone:</span> {user.phone}
              </div>
              <div>
                <span className="font-medium">Pays:</span> {user.country || 'Non renseigné'}
              </div>
              <div>
                <span className="font-medium">Solde:</span> 
                <span className="text-green-600 font-semibold ml-1">
                  {formatCurrency(user.balance, 'XAF')}
                </span>
              </div>
              <div>
                <span className="font-medium">Créé:</span> {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>

            {!isSubAdmin && (
              <div className="flex gap-2 mt-3">
                <Select 
                  value={user.role} 
                  onValueChange={(value) => onQuickRoleChange(user.id, value as any)}
                >
                  <SelectTrigger className="flex-1 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Utilisateur</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="sub_admin">Sous-Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant={user.is_banned ? "outline" : "destructive"}
                  size="sm"
                  onClick={() => onQuickBanToggle(user.id, user.is_banned || false)}
                  className="px-3"
                >
                  {user.is_banned ? <UserCheck className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Utilisateur</TableHead>
            <TableHead>Téléphone</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Pays</TableHead>
            <TableHead>Solde</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Créé</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="hover:bg-gray-50">
              <TableCell>
                <div>
                  <p className="font-medium">{user.full_name || 'Non renseigné'}</p>
                  <p className="text-sm text-gray-500">{user.id.substring(0, 8)}...</p>
                </div>
              </TableCell>
              <TableCell>{user.phone}</TableCell>
              <TableCell>
                {isSubAdmin ? (
                  <Badge className={`${getRoleColor(user.role)} flex items-center gap-1 w-fit`}>
                    {getRoleIcon(user.role)}
                    {getRoleLabel(user.role)}
                  </Badge>
                ) : (
                  <Select 
                    value={user.role} 
                    onValueChange={(value) => onQuickRoleChange(user.id, value as any)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue>
                        <div className="flex items-center gap-1">
                          {getRoleIcon(user.role)}
                          {getRoleLabel(user.role)}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Utilisateur
                        </div>
                      </SelectItem>
                      <SelectItem value="agent">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4" />
                          Agent
                        </div>
                      </SelectItem>
                      <SelectItem value="sub_admin">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Sous-Admin
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2 text-red-700">
                          <Crown className="w-4 h-4" />
                          Admin
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </TableCell>
              <TableCell>{user.country || 'Non renseigné'}</TableCell>
              <TableCell>
                <span className="font-semibold text-green-600">
                  {formatCurrency(user.balance, 'XAF')}
                </span>
              </TableCell>
              <TableCell>
                {user.is_banned ? (
                  <Badge variant="destructive">Banni</Badge>
                ) : (
                  <Badge variant="outline" className="text-green-600 border-green-600">Actif</Badge>
                )}
              </TableCell>
              <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewUser(user)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  
                  {!isSubAdmin && (
                    <Button
                      variant={user.is_banned ? "outline" : "destructive"}
                      size="sm"
                      onClick={() => onQuickBanToggle(user.id, user.is_banned || false)}
                    >
                      {user.is_banned ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UsersDataTable;
