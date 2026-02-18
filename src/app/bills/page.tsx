'use client';

import { useState, useMemo } from 'react';
import { useFinanceStore } from '@/lib/store';
import { formatCurrency, formatDate, getBillStatus, todayISO } from '@/lib/helpers';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import {
    Plus, FileText, Trash2, Edit3, Check, Calendar,
    Bell, BellOff, Clock, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import styles from './bills.module.css';
import CurrencyInput from '@/components/CurrencyInput';

export default function BillsPage() {
    const { bills, categories, addBill, updateBill, deleteBill, markBillPaid } = useFinanceStore();
    const { showToast } = useToast();

    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);

    const [formName, setFormName] = useState('');
    const [formAmount, setFormAmount] = useState('');
    const [formCategory, setFormCategory] = useState('');
    const [formFrequency, setFormFrequency] = useState<'weekly' | 'monthly' | 'yearly' | 'custom'>('monthly');
    const [formCustomDays, setFormCustomDays] = useState('30');
    const [formDueDate, setFormDueDate] = useState(todayISO());
    const [formRemind, setFormRemind] = useState('3');
    const [formAutoRecord, setFormAutoRecord] = useState(true);

    const expenseCategories = useMemo(
        () => categories.filter((c) => c.type === 'expense'),
        [categories]
    );

    const sortedBills = useMemo(() => {
        return [...bills]
            .filter((b) => b.is_active)
            .sort((a, b) => {
                const statusOrder = { overdue: 0, 'due-soon': 1, upcoming: 2 };
                const sa = statusOrder[getBillStatus(a)];
                const sb = statusOrder[getBillStatus(b)];
                return sa - sb || a.next_due.localeCompare(b.next_due);
            });
    }, [bills]);

    const resetForm = () => {
        setFormName('');
        setFormAmount('');
        setFormCategory('');
        setFormFrequency('monthly');
        setFormCustomDays('30');
        setFormDueDate(todayISO());
        setFormRemind('3');
        setFormAutoRecord(true);
        setEditId(null);
    };

    const openAdd = () => { resetForm(); setShowModal(true); };

    const openEdit = (id: string) => {
        const b = bills.find((bl) => bl.id === id);
        if (!b) return;
        setFormName(b.name);
        setFormAmount(b.amount.toString());
        setFormCategory(b.category);
        setFormFrequency(b.frequency);
        setFormCustomDays(b.custom_days?.toString() || '30');
        setFormDueDate(b.next_due);
        setFormRemind(b.remind_days_before.toString());
        setFormAutoRecord(b.auto_record);
        setEditId(id);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formCategory) { showToast('Pilih kategori!', 'error'); return; }

        const data = {
            name: formName,
            amount: parseFloat(formAmount),
            category: formCategory,
            frequency: formFrequency,
            custom_days: formFrequency === 'custom' ? parseInt(formCustomDays) : undefined,
            due_date: formDueDate,
            next_due: formDueDate,
            is_active: true,
            remind_days_before: parseInt(formRemind),
            auto_record: formAutoRecord,
        };

        if (editId) {
            await updateBill(editId, data);
            showToast('Tagihan diperbarui');
        } else {
            await addBill(data);
            showToast('Tagihan ditambahkan');
        }
        setShowModal(false);
        resetForm();
    };

    const handlePaid = async (id: string) => {
        await markBillPaid(id);
        showToast('Tagihan ditandai lunas');
    };

    const handleDelete = async (id: string) => {
        await deleteBill(id);
        showToast('Tagihan dihapus');
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'overdue':
                return { label: 'Terlambat', color: 'var(--danger)', bg: 'var(--danger-light)', icon: AlertTriangle };
            case 'due-soon':
                return { label: 'Segera', color: 'var(--warning)', bg: 'var(--warning-light)', icon: Clock };
            default:
                return { label: 'Akan Datang', color: 'var(--success)', bg: 'var(--success-light)', icon: CheckCircle2 };
        }
    };

    const frequencyLabel = (f: string) => {
        switch (f) {
            case 'weekly': return 'Mingguan';
            case 'monthly': return 'Bulanan';
            case 'yearly': return 'Tahunan';
            default: return 'Custom';
        }
    };

    return (
        <div className="page">
            <h1 className="page-title">Tagihan</h1>

            {/* Summary */}
            <div className="grid-3" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="stat-card">
                    <div className="stat-label">Total Tagihan</div>
                    <div className="stat-value" style={{ fontSize: 'var(--font-xl)' }}>{sortedBills.length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Bulanan</div>
                    <div className="stat-value expense" style={{ fontSize: 'var(--font-xl)' }}>
                        {formatCurrency(sortedBills.filter(b => b.frequency === 'monthly').reduce((s, b) => s + b.amount, 0))}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Terlambat</div>
                    <div className="stat-value" style={{
                        fontSize: 'var(--font-xl)',
                        color: sortedBills.filter(b => getBillStatus(b) === 'overdue').length > 0 ? 'var(--danger)' : 'var(--success)'
                    }}>
                        {sortedBills.filter(b => getBillStatus(b) === 'overdue').length}
                    </div>
                </div>
            </div>

            {/* Bills List */}
            {sortedBills.length === 0 ? (
                <div className="empty-state">
                    <FileText size={48} />
                    <p>Belum ada tagihan</p>
                    <button className="btn btn-primary btn-sm" onClick={openAdd}>
                        <Plus size={16} /> Tambah Tagihan
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {sortedBills.map((bill) => {
                        const status = getBillStatus(bill);
                        const config = getStatusConfig(status);
                        const StatusIcon = config.icon;
                        return (
                            <div key={bill.id} className="card-flat">
                                <div className="flex-between" style={{ marginBottom: 'var(--space-sm)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{
                                            width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                                            background: config.bg,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <StatusIcon size={18} style={{ color: config.color }} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{bill.name}</div>
                                            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                                                {frequencyLabel(bill.frequency)} · {bill.category}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="badge" style={{ background: config.bg, color: config.color }}>
                                        {config.label}
                                    </span>
                                </div>

                                <div className="flex-between" style={{ marginBottom: 'var(--space-sm)' }}>
                                    <div>
                                        <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700 }}>{formatCurrency(bill.amount)}</span>
                                    </div>
                                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Calendar size={12} /> {formatDate(bill.next_due)}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                    <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handlePaid(bill.id)}>
                                        <Check size={14} /> Bayar
                                    </button>
                                    <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(bill.id)}>
                                        <Edit3 size={14} />
                                    </button>
                                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleDelete(bill.id)}>
                                        <Trash2 size={14} color="var(--danger)" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* FAB */}
            <button className="fab" onClick={openAdd}>
                <Plus size={24} />
            </button>

            {/* Add/Edit Modal */}
            <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editId ? 'Edit Tagihan' : 'Tambah Tagihan'}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div className="input-group">
                        <label>Nama Tagihan</label>
                        <input type="text" className="input" placeholder="Listrik, Internet, dll" value={formName} onChange={(e) => setFormName(e.target.value)} required />
                    </div>
                    <div className="form-row">
                        <div className="input-group">
                            <label>Jumlah (Rp)</label>
                            <CurrencyInput value={formAmount} onChange={setFormAmount} placeholder="0" required />
                        </div>
                        <div className="input-group">
                            <label>Kategori</label>
                            <select className="input" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} required>
                                <option value="">Pilih</option>
                                {expenseCategories.map((c) => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="input-group">
                            <label>Frekuensi</label>
                            <select className="input" value={formFrequency} onChange={(e) => setFormFrequency(e.target.value as any)}>
                                <option value="weekly">Mingguan</option>
                                <option value="monthly">Bulanan</option>
                                <option value="yearly">Tahunan</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>
                        {formFrequency === 'custom' && (
                            <div className="input-group">
                                <label>Setiap (hari)</label>
                                <input type="number" className="input" value={formCustomDays} onChange={(e) => setFormCustomDays(e.target.value)} min={1} />
                            </div>
                        )}
                        <div className="input-group">
                            <label>Jatuh Tempo</label>
                            <input type="date" className="input" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} required />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="input-group">
                            <label>Ingatkan (hari sebelum)</label>
                            <input type="number" className="input" value={formRemind} onChange={(e) => setFormRemind(e.target.value)} min={0} max={30} />
                        </div>
                        <div className="input-group">
                            <label style={{ marginBottom: 8 }}>Auto catat</label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 'var(--font-sm)' }}>
                                <input
                                    type="checkbox"
                                    checked={formAutoRecord}
                                    onChange={(e) => setFormAutoRecord(e.target.checked)}
                                    style={{ width: 20, height: 20, accentColor: 'var(--accent-primary)' }}
                                />
                                Otomatis masuk transaksi
                            </label>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary btn-full">
                        {editId ? 'Simpan' : 'Tambah Tagihan'}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
