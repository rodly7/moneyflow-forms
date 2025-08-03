import React, { useState } from 'react';
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

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

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
      setShowCreateForm(false);
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
      setShowEditForm(false);
      setSelectedBill(null);
    } catch (error) {
      console.error('Error updating bill:', error);
    }
  };

  const openEditForm = (bill: any) => {
    setSelectedBill(bill);
    setFormData({
      bill_name: bill.bill_name,
      amount: bill.amount.toString(),
      due_date: bill.due_date,
      recurrence: bill.recurrence,
      priority: bill.priority.toString(),
      is_automated: bill.is_automated
    });
    setShowEditForm(true);
  };

  const openHistory = (bill: any) => {
    setSelectedBill(bill);
    fetchPaymentHistory(bill.id);
    setShowHistory(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'background: #fef3c7; color: #92400e;';
      case 'paid': return 'background: #dcfce7; color: #166534;';
      case 'failed': return 'background: #fee2e2; color: #991b1b;';
      default: return 'background: #f3f4f6; color: #374151;';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'background: #fee2e2; color: #991b1b;';
      case 2: return 'background: #fef3c7; color: #92400e;';
      case 3: return 'background: #dcfce7; color: #166534;';
      default: return 'background: #f3f4f6; color: #374151;';
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

  const styles = `
    .bill-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .overdue-card {
      border-color: #fee2e2;
      background: #fef2f2;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    .form-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .form-container {
      background: white;
      padding: 24px;
      border-radius: 8px;
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }
    .form-group {
      margin-bottom: 16px;
    }
    .form-label {
      display: block;
      margin-bottom: 4px;
      font-weight: 500;
      color: #374151;
    }
    .form-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 14px;
    }
    .form-select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 14px;
      background: white;
    }
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .btn-primary {
      background: #3b82f6;
      color: white;
    }
    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
    }
    .btn-small {
      padding: 4px 8px;
      font-size: 12px;
    }
    .checkbox-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .grid {
      display: grid;
    }
    .grid-2 {
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    .grid-4 {
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    .flex {
      display: flex;
    }
    .flex-between {
      justify-content: space-between;
    }
    .flex-gap {
      gap: 8px;
    }
    .mb-2 {
      margin-bottom: 8px;
    }
    .text-muted {
      color: #6b7280;
      font-size: 14px;
    }
    .text-semibold {
      font-weight: 600;
    }
    .text-center {
      text-align: center;
    }
    .alert {
      padding: 12px;
      border-radius: 4px;
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
    }
    @media (max-width: 768px) {
      .grid-4 {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div>
        <div className="flex flex-between mb-2" style={{ marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
              Factures Automatiques
            </h2>
            <p className="text-muted">Gérez vos paiements automatiques</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus size={16} />
            Nouvelle Facture
          </button>
        </div>

        {/* Liste des factures */}
        <div>
          {bills.map((bill) => (
            <div
              key={bill.id}
              className={`bill-card ${isOverdue(bill.due_date) && bill.status === 'pending' ? 'overdue-card' : ''}`}
            >
              <div className="flex flex-between mb-2" style={{ marginBottom: '12px' }}>
                <div className="flex flex-gap" style={{ alignItems: 'center' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                    {bill.bill_name}
                  </h3>
                  <span className="badge" style={{
                    backgroundColor: bill.status === 'pending' ? '#fef3c7' : bill.status === 'paid' ? '#dcfce7' : '#fee2e2',
                    color: bill.status === 'pending' ? '#92400e' : bill.status === 'paid' ? '#166534' : '#991b1b'
                  }}>
                    {bill.status === 'pending' && <Clock size={12} />}
                    {bill.status === 'paid' && <CheckCircle size={12} />}
                    {bill.status === 'failed' && <AlertTriangle size={12} />}
                    {bill.status === 'pending' ? 'En attente' : 
                     bill.status === 'paid' ? 'Payée' : 'Échouée'}
                  </span>
                  <span className="badge" style={{
                    backgroundColor: bill.priority === 1 ? '#fee2e2' : bill.priority === 2 ? '#fef3c7' : '#dcfce7',
                    color: bill.priority === 1 ? '#991b1b' : bill.priority === 2 ? '#92400e' : '#166534'
                  }}>
                    {bill.priority === 1 ? 'Haute' : 
                     bill.priority === 2 ? 'Moyenne' : 'Basse'}
                  </span>
                </div>
                <div className="flex flex-gap" style={{ alignItems: 'center' }}>
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={bill.is_automated}
                      onChange={(e) => toggleAutomation(bill.id, e.target.checked)}
                    />
                    Auto
                  </label>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => openEditForm(bill)}
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => deleteBill(bill.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-4" style={{ marginBottom: '16px' }}>
                <div>
                  <p className="text-muted" style={{ margin: '0 0 4px 0' }}>Montant</p>
                  <p className="text-semibold" style={{ margin: 0 }}>
                    {bill.amount.toLocaleString()} XAF
                  </p>
                </div>
                <div>
                  <p className="text-muted" style={{ margin: '0 0 4px 0' }}>Échéance</p>
                  <p 
                    className="text-semibold"
                    style={{ 
                      margin: 0,
                      color: isOverdue(bill.due_date) && bill.status === 'pending' ? '#dc2626' : 'inherit'
                    }}
                  >
                    {format(new Date(bill.due_date), 'dd/MM/yyyy', { locale: fr })}
                  </p>
                </div>
                <div>
                  <p className="text-muted" style={{ margin: '0 0 4px 0' }}>Récurrence</p>
                  <p className="text-semibold" style={{ margin: 0 }}>
                    {getRecurrenceText(bill.recurrence)}
                  </p>
                </div>
                <div>
                  <p className="text-muted" style={{ margin: '0 0 4px 0' }}>Tentatives</p>
                  <p className="text-semibold" style={{ margin: 0 }}>
                    {bill.payment_attempts}/{bill.max_attempts}
                  </p>
                </div>
              </div>

              {isOverdue(bill.due_date) && bill.status === 'pending' && (
                <div className="alert">
                  <AlertTriangle size={16} />
                  Facture en retard - Paiement automatique en cours
                </div>
              )}

              <div className="flex flex-gap" style={{ marginTop: '12px' }}>
                <button
                  className="btn btn-primary btn-small"
                  onClick={() => payBillManually(bill.id)}
                  disabled={bill.status === 'paid'}
                >
                  Payer maintenant
                </button>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => openHistory(bill)}
                >
                  Historique
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Formulaire de création */}
        {showCreateForm && (
          <div className="form-overlay" onClick={() => setShowCreateForm(false)}>
            <div className="form-container" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-between mb-2" style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                  Nouvelle Facture Automatique
                </h3>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => setShowCreateForm(false)}
                >
                  <X size={16} />
                </button>
              </div>
              
              <form onSubmit={handleCreateBill}>
                <div className="form-group">
                  <label className="form-label">Nom de la facture</label>
                  <input
                    className="form-input"
                    type="text"
                    value={formData.bill_name}
                    onChange={(e) => setFormData({ ...formData, bill_name: e.target.value })}
                    placeholder="Ex: Électricité, Loyer, Internet..."
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Montant (XAF)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Date d'échéance</label>
                  <input
                    className="form-input"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Récurrence</label>
                  <select
                    className="form-select"
                    value={formData.recurrence}
                    onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                  >
                    <option value="monthly">Mensuelle</option>
                    <option value="quarterly">Trimestrielle</option>
                    <option value="yearly">Annuelle</option>
                    <option value="once">Une fois</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Priorité</label>
                  <select
                    className="form-select"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="1">Haute</option>
                    <option value="2">Moyenne</option>
                    <option value="3">Basse</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={formData.is_automated}
                      onChange={(e) => setFormData({ ...formData, is_automated: e.target.checked })}
                    />
                    Paiement automatique activé
                  </label>
                </div>
                
                <div className="flex flex-gap">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Créer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Formulaire d'édition */}
        {showEditForm && (
          <div className="form-overlay" onClick={() => setShowEditForm(false)}>
            <div className="form-container" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-between mb-2" style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                  Modifier la Facture
                </h3>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => setShowEditForm(false)}
                >
                  <X size={16} />
                </button>
              </div>
              
              <form onSubmit={handleEditBill}>
                <div className="form-group">
                  <label className="form-label">Nom de la facture</label>
                  <input
                    className="form-input"
                    type="text"
                    value={formData.bill_name}
                    onChange={(e) => setFormData({ ...formData, bill_name: e.target.value })}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Montant (XAF)</label>
                  <input
                    className="form-input"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Date d'échéance</label>
                  <input
                    className="form-input"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Récurrence</label>
                  <select
                    className="form-select"
                    value={formData.recurrence}
                    onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                  >
                    <option value="monthly">Mensuelle</option>
                    <option value="quarterly">Trimestrielle</option>
                    <option value="yearly">Annuelle</option>
                    <option value="once">Une fois</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Priorité</label>
                  <select
                    className="form-select"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="1">Haute</option>
                    <option value="2">Moyenne</option>
                    <option value="3">Basse</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={formData.is_automated}
                      onChange={(e) => setFormData({ ...formData, is_automated: e.target.checked })}
                    />
                    Paiement automatique activé
                  </label>
                </div>
                
                <div className="flex flex-gap">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowEditForm(false)}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Sauvegarder
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Historique */}
        {showHistory && (
          <div className="form-overlay" onClick={() => setShowHistory(false)}>
            <div className="form-container" onClick={(e) => e.stopPropagation()}>
              <div className="flex flex-between mb-2" style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                  Historique - {selectedBill?.bill_name}
                </h3>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => setShowHistory(false)}
                >
                  <X size={16} />
                </button>
              </div>
              
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {paymentHistory.length === 0 ? (
                  <p className="text-center text-muted" style={{ padding: '16px' }}>
                    Aucun historique de paiement
                  </p>
                ) : (
                  paymentHistory.map((payment) => (
                    <div key={payment.id} className="bill-card">
                      <div className="flex flex-between">
                        <div>
                          <p className="text-semibold" style={{ margin: '0 0 4px 0' }}>
                            {payment.amount.toLocaleString()} XAF
                          </p>
                          <p className="text-muted" style={{ margin: '0 0 4px 0' }}>
                            {format(new Date(payment.payment_date), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                          </p>
                          <p className="text-muted" style={{ margin: 0 }}>
                            Tentative #{payment.attempt_number}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className="badge" style={{
                            backgroundColor: payment.status === 'success' ? '#dcfce7' : '#fee2e2',
                            color: payment.status === 'success' ? '#166534' : '#991b1b'
                          }}>
                            {payment.status === 'success' ? 'Succès' : 
                             payment.status === 'insufficient_funds' ? 'Solde insuffisant' : 
                             payment.status}
                          </span>
                          {payment.error_message && (
                            <p style={{ 
                              margin: '4px 0 0 0', 
                              fontSize: '12px', 
                              color: '#dc2626' 
                            }}>
                              {payment.error_message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};