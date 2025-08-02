import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Calendar, Clock, AlertTriangle, CheckCircle, X, Edit, Trash2 } from 'lucide-react';
import { useAutomaticBills } from '@/hooks/useAutomaticBills';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const AutomaticBillsManager = () => {
  const {
    bills,
    paymentHistory,
    loading,
    createBill,
    updateBill,
    deleteBill,
    toggleAutomation,
    payBillManually,
    fetchPaymentHistory
  } = useAutomaticBills();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    bill_name: '',
    amount: '',
    due_date: '',
    recurrence: 'monthly',
    priority: '2',
    is_automated: true
  });

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBill({
        bill_name: formData.bill_name,
        amount: parseFloat(formData.amount),
        due_date: formData.due_date,
        recurrence: formData.recurrence,
        priority: parseInt(formData.priority),
        is_automated: formData.is_automated,
        status: 'pending'
      });
      setIsCreateDialogOpen(false);
      setFormData({
        bill_name: '',
        amount: '',
        due_date: '',
        recurrence: 'monthly',
        priority: '2',
        is_automated: true
      });
    } catch (error) {
      console.error('Error creating bill:', error);
    }
  };

  const handleEditBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;
    
    try {
      await updateBill(selectedBill.id, {
        bill_name: formData.bill_name,
        amount: parseFloat(formData.amount),
        due_date: formData.due_date,
        recurrence: formData.recurrence,
        priority: parseInt(formData.priority),
        is_automated: formData.is_automated
      });
      setIsEditDialogOpen(false);
      setSelectedBill(null);
    } catch (error) {
      console.error('Error updating bill:', error);
    }
  };

  const openEditDialog = (bill: any) => {
    setSelectedBill(bill);
    setFormData({
      bill_name: bill.bill_name,
      amount: bill.amount.toString(),
      due_date: bill.due_date,
      recurrence: bill.recurrence,
      priority: bill.priority.toString(),
      is_automated: bill.is_automated
    });
    setIsEditDialogOpen(true);
  };

  const openHistoryDialog = (bill: any) => {
    setSelectedBill(bill);
    fetchPaymentHistory(bill.id);
    setIsHistoryDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-green-50 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Payée</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700"><AlertTriangle className="w-3 h-3 mr-1" />Échouée</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: number) => {
    switch (priority) {
      case 1:
        return <Badge className="bg-red-100 text-red-800">Haute</Badge>;
      case 2:
        return <Badge className="bg-yellow-100 text-yellow-800">Moyenne</Badge>;
      case 3:
        return <Badge className="bg-green-100 text-green-800">Basse</Badge>;
      default:
        return <Badge variant="outline">Inconnue</Badge>;
    }
  };

  const getRecurrenceText = (recurrence: string) => {
    switch (recurrence) {
      case 'monthly': return 'Mensuelle';
      case 'quarterly': return 'Trimestrielle';
      case 'yearly': return 'Annuelle';
      case 'once': return 'Une fois';
      default: return recurrence;
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Factures Automatiques</h2>
          <p className="text-muted-foreground">Gérez vos paiements automatiques</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Facture
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une nouvelle facture automatique</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateBill} className="space-y-4">
              <div>
                <Label htmlFor="bill_name">Nom de la facture</Label>
                <Input
                  id="bill_name"
                  value={formData.bill_name}
                  onChange={(e) => setFormData({ ...formData, bill_name: e.target.value })}
                  placeholder="Ex: Électricité, Loyer, Internet..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="amount">Montant (XAF)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="due_date">Date d'échéance</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="recurrence">Récurrence</Label>
                <Select value={formData.recurrence} onValueChange={(value) => setFormData({ ...formData, recurrence: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensuelle</SelectItem>
                    <SelectItem value="quarterly">Trimestrielle</SelectItem>
                    <SelectItem value="yearly">Annuelle</SelectItem>
                    <SelectItem value="once">Une fois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priorité</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Haute</SelectItem>
                    <SelectItem value="2">Moyenne</SelectItem>
                    <SelectItem value="3">Basse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_automated"
                  checked={formData.is_automated}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_automated: checked })}
                />
                <Label htmlFor="is_automated">Paiement automatique activé</Label>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Créer</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Liste des factures */}
      <div className="grid gap-4">
        {bills.map((bill) => (
          <Card key={bill.id} className={`${isOverdue(bill.due_date) && bill.status === 'pending' ? 'border-red-200 bg-red-50' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">{bill.bill_name}</CardTitle>
                  {getStatusBadge(bill.status)}
                  {getPriorityBadge(bill.priority)}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={bill.is_automated}
                    onCheckedChange={(checked) => toggleAutomation(bill.id, checked)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(bill)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteBill(bill.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Montant</p>
                  <p className="font-semibold">{bill.amount.toLocaleString()} XAF</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Échéance</p>
                  <p className={`font-semibold ${isOverdue(bill.due_date) && bill.status === 'pending' ? 'text-red-600' : ''}`}>
                    {format(new Date(bill.due_date), 'dd/MM/yyyy', { locale: fr })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Récurrence</p>
                  <p className="font-semibold">{getRecurrenceText(bill.recurrence)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tentatives</p>
                  <p className="font-semibold">{bill.payment_attempts}/{bill.max_attempts}</p>
                </div>
              </div>
              
              {isOverdue(bill.due_date) && bill.status === 'pending' && (
                <div className="flex items-center gap-2 p-2 bg-red-100 rounded text-red-700 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Facture en retard - Paiement automatique en cours</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => payBillManually(bill.id)}
                  disabled={bill.status === 'paid'}
                >
                  Payer maintenant
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openHistoryDialog(bill)}
                >
                  Historique
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog d'édition */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la facture</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditBill} className="space-y-4">
            <div>
              <Label htmlFor="edit_bill_name">Nom de la facture</Label>
              <Input
                id="edit_bill_name"
                value={formData.bill_name}
                onChange={(e) => setFormData({ ...formData, bill_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_amount">Montant (XAF)</Label>
              <Input
                id="edit_amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_due_date">Date d'échéance</Label>
              <Input
                id="edit_due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit_recurrence">Récurrence</Label>
              <Select value={formData.recurrence} onValueChange={(value) => setFormData({ ...formData, recurrence: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensuelle</SelectItem>
                  <SelectItem value="quarterly">Trimestrielle</SelectItem>
                  <SelectItem value="yearly">Annuelle</SelectItem>
                  <SelectItem value="once">Une fois</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_priority">Priorité</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Haute</SelectItem>
                  <SelectItem value="2">Moyenne</SelectItem>
                  <SelectItem value="3">Basse</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit_is_automated"
                checked={formData.is_automated}
                onCheckedChange={(checked) => setFormData({ ...formData, is_automated: checked })}
              />
              <Label htmlFor="edit_is_automated">Paiement automatique activé</Label>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Sauvegarder</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog d'historique */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Historique des paiements - {selectedBill?.bill_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {paymentHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Aucun historique de paiement</p>
            ) : (
              paymentHistory.map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{payment.amount.toLocaleString()} XAF</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(payment.payment_date), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Tentative #{payment.attempt_number}
                        </p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(payment.status)}
                        {payment.error_message && (
                          <p className="text-sm text-red-600 mt-1">{payment.error_message}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};