'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Eye, X } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface Payment {
  id: string;
  teacher_id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  receipt_url: string | null;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
}

const STATUS_TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'verified', label: 'Verified' },
  { key: 'rejected', label: 'Rejected' },
] as const;

const METHODS = [
  { value: 'vodafone_cash', label: 'Vodafone Cash' },
  { value: 'instapay', label: 'InstaPay' },
  { value: 'paymob', label: 'Paymob' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' },
] as const;

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [filterMethod, setFilterMethod] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [receiptModal, setReceiptModal] = useState<string | null>(null);

  // Create form state
  const [createForm, setCreateForm] = useState({
    teacher_id: '',
    amount: '',
    method: 'vodafone_cash',
    reference_number: '',
    notes: '',
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadPayments = useCallback(async () => {
    let url = `/api/admin/payments?status=${filterStatus}`;
    if (filterMethod) url += `&method=${filterMethod}`;
    const res = await fetch(url);
    const json = await res.json();
    setPayments(json.success ? json.data : []);
    setLoading(false);
  }, [filterStatus, filterMethod]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  async function updatePayment(id: string, status: string) {
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const json = await res.json();
      if (!json.success) alert(json.message || 'Failed to update payment');
      await loadPayments();
    } catch {
      alert('Network error — please try again');
    } finally {
      setActionLoading(null);
    }
  }

  async function createPayment(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');
    try {
      const formData = new FormData();
      formData.append('teacher_id', createForm.teacher_id);
      formData.append('amount', createForm.amount);
      formData.append('method', createForm.method);
      if (createForm.reference_number) formData.append('reference_number', createForm.reference_number);
      if (createForm.notes) formData.append('notes', createForm.notes);
      if (receiptFile) formData.append('receipt', receiptFile);

      const res = await fetch('/api/admin/payments', { method: 'POST', body: formData });
      const json = await res.json();
      if (!json.success) {
        setCreateError(json.message || 'Failed to create payment');
      } else {
        setShowCreate(false);
        setCreateForm({ teacher_id: '', amount: '', method: 'vodafone_cash', reference_number: '', notes: '' });
        setReceiptFile(null);
        await loadPayments();
      }
    } catch {
      setCreateError('Network error');
    } finally {
      setCreateLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-ink font-display">Payments</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-4 py-2 text-xs font-mono uppercase tracking-wider bg-accent text-ink hover:bg-accent/90 transition-colors"
        >
          {showCreate ? 'Cancel' : 'Log Payment'}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={createPayment} className="border border-ink/10 p-4 mb-6 space-y-4">
          {createError && <div className="bg-destructive/10 text-destructive text-sm p-3 font-body">{createError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-ink/60 mb-1">Teacher ID</label>
              <input
                type="text"
                value={createForm.teacher_id}
                onChange={(e) => setCreateForm({ ...createForm, teacher_id: e.target.value })}
                required
                className="w-full h-10 px-3 border border-ink bg-canvas font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="UUID"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-ink/60 mb-1">Amount (EGP)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={createForm.amount}
                onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
                required
                className="w-full h-10 px-3 border border-ink bg-canvas font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-ink/60 mb-1">Method</label>
              <select
                value={createForm.method}
                onChange={(e) => setCreateForm({ ...createForm, method: e.target.value })}
                className="w-full h-10 px-3 border border-ink bg-canvas font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-ink/60 mb-1">Reference #</label>
              <input
                type="text"
                value={createForm.reference_number}
                onChange={(e) => setCreateForm({ ...createForm, reference_number: e.target.value })}
                className="w-full h-10 px-3 border border-ink bg-canvas font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-ink/60 mb-1">Receipt</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              className="w-full text-sm font-body text-ink/60 file:mr-4 file:py-2 file:px-4 file:border file:border-ink/20 file:text-sm file:font-mono file:uppercase file:tracking-wider file:bg-surface-sage file:text-ink hover:file:bg-surface-cool file:cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-ink/60 mb-1">Notes</label>
            <input
              type="text"
              value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              className="w-full h-10 px-3 border border-ink bg-canvas font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button
            type="submit"
            disabled={createLoading}
            className="px-6 py-2 text-xs font-mono uppercase tracking-wider bg-accent text-ink hover:bg-accent/90 disabled:opacity-50 transition-colors"
          >
            {createLoading ? 'Creating...' : 'Create Payment'}
          </button>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setFilterStatus(tab.key); setLoading(true); }}
            className={`px-4 py-2 text-sm font-mono uppercase tracking-wider transition-colors ${
              filterStatus === tab.key
                ? 'bg-accent text-ink font-medium'
                : 'bg-surface-cool text-ink/60 hover:text-ink hover:bg-surface-sage'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <select
          value={filterMethod}
          onChange={(e) => { setFilterMethod(e.target.value); setLoading(true); }}
          className="h-10 px-3 border border-ink bg-canvas font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">All Methods</option>
          {METHODS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading payments..." />
      ) : (
        <div className="bg-canvas border border-ink/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-ink/10">
              <tr>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink/60">Teacher</th>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink/60">Amount</th>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink/60">Method</th>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink/60">Date</th>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink/60">Receipt</th>
                <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-wider text-ink/60">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-surface-sage/50 transition-colors">
                  <td className="px-4 py-3 font-body">{p.teacher_id.slice(0, 8)}...</td>
                  <td className="px-4 py-3 font-body font-medium">{p.amount} {p.currency}</td>
                  <td className="px-4 py-3 font-mono text-xs uppercase tracking-wider">{p.method.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-ink/60 font-body">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {p.receipt_url ? (
                      <button
                        onClick={() => setReceiptModal(p.receipt_url)}
                        className="flex items-center gap-1 text-primary hover:text-primary/80 text-xs font-mono uppercase tracking-wider"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    ) : (
                      <span className="text-ink/30 text-xs font-body">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {filterStatus === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updatePayment(p.id, 'verified')}
                          disabled={actionLoading === p.id}
                          className="flex items-center gap-1 text-success hover:text-success/80 text-xs font-mono uppercase tracking-wider font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          {actionLoading === p.id ? 'Saving...' : 'Verify'}
                        </button>
                        <button
                          onClick={() => updatePayment(p.id, 'rejected')}
                          disabled={actionLoading === p.id}
                          className="flex items-center gap-1 text-destructive hover:text-destructive/80 text-xs font-mono uppercase tracking-wider font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          {actionLoading === p.id ? 'Saving...' : 'Reject'}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-ink/40 font-body">No {filterStatus} payments</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Receipt modal */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setReceiptModal(null)}>
          <div className="bg-canvas p-4 max-w-2xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-ink font-display">Receipt</h3>
              <button onClick={() => setReceiptModal(null)} className="text-ink/40 hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>
            {receiptModal.endsWith('.pdf') ? (
              <iframe src={receiptModal} className="w-full h-[60vh]" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={receiptModal} alt="Receipt" className="max-w-full h-auto" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
