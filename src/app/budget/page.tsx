'use client';

import { useState, useMemo } from 'react';
import { useFinanceStore } from '@/lib/store';
import { formatCurrency, getMonthlySpending } from '@/lib/helpers';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import { Plus, Target, Trash2, Edit3 } from 'lucide-react';
import CurrencyInput from '@/components/CurrencyInput';

export default function BudgetPage() {
    const { budgets, categories, transactions, addBudget, updateBudget, deleteBudget } = useFinanceStore();
    const { showToast } = useToast();

    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [formCategory, setFormCategory] = useState('');
    const [formLimit, setFormLimit] = useState('');
    const [formPeriod, setFormPeriod] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');

    const expenseCategories = useMemo(
        () => categories.filter((c) => c.type === 'expense'),
        [categories]
    );

    const budgetData = useMemo(() => {
        return budgets.map((b) => {
            const spent = getMonthlySpending(transactions, b.category);
            const percentage = b.limit_amount > 0 ? (spent / b.limit_amount) * 100 : 0;
            const remaining = b.limit_amount - spent;
            const catInfo = categories.find((c) => c.name === b.category);
            return { ...b, spent, percentage, remaining, catInfo };
        });
    }, [budgets, transactions, categories]);

    const totalBudget = useMemo(() => budgets.reduce((s, b) => s + b.limit_amount, 0), [budgets]);
    const totalSpent = useMemo(() => budgetData.reduce((s, b) => s + b.spent, 0), [budgetData]);

    const resetForm = () => {
        setFormCategory('');
        setFormLimit('');
        setFormPeriod('monthly');
        setEditId(null);
    };

    const openAdd = () => { resetForm(); setShowModal(true); };
    const openEdit = (id: string) => {
        const b = budgets.find((bg) => bg.id === id);
        if (!b) return;
        setFormCategory(b.category);
        setFormLimit(b.limit_amount.toString());
        setFormPeriod(b.period);
        setEditId(id);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formCategory) { showToast('Pilih kategori!', 'error'); return; }

        const data = {
            category: formCategory,
            limit_amount: parseFloat(formLimit),
            period: formPeriod,
        };

        if (editId) {
            await updateBudget(editId, data);
            showToast('Budget diperbarui');
        } else {
            await addBudget(data);
            showToast('Budget ditambahkan');
        }
        setShowModal(false);
        resetForm();
    };

    const handleDelete = async (id: string) => {
        await deleteBudget(id);
        showToast('Budget dihapus');
    };

    return (
        <div className="page">
            <h1 className="page-title">Budget</h1>

            {/* Summary */}
            <div className="card-flat" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="flex-between" style={{ marginBottom: 'var(--space-md)' }}>
                    <div>
                        <div className="stat-label">Total Terpakai</div>
                        <div className="stat-value expense">{formatCurrency(totalSpent)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div className="stat-label">Total Budget</div>
                        <div className="stat-value" style={{ color: 'var(--text-primary)' }}>{formatCurrency(totalBudget)}</div>
                    </div>
                </div>
                {totalBudget > 0 && (
                    <div className="progress-bar">
                        <div
                            className={`progress-bar-fill ${(totalSpent / totalBudget) * 100 >= 100 ? 'danger' :
                                (totalSpent / totalBudget) * 100 >= 80 ? 'warning' : ''
                                }`}
                            style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
                        />
                    </div>
                )}
            </div>

            {/* Budget List */}
            {budgetData.length === 0 ? (
                <div className="empty-state">
                    <Target size={48} />
                    <p>Belum ada budget yang diatur</p>
                    <button className="btn btn-primary btn-sm" onClick={openAdd}>
                        <Plus size={16} /> Tambah Budget
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {budgetData.map((b) => (
                        <div key={b.id} className="card-flat">
                            <div className="flex-between" style={{ marginBottom: 'var(--space-sm)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                                        background: `${b.catInfo?.color || '#6c5ce7'}22`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <span style={{ color: b.catInfo?.color, fontSize: 16 }}>●</span>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{b.category}</div>
                                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                                            {b.period === 'monthly' ? 'Bulanan' : b.period === 'weekly' ? 'Mingguan' : 'Tahunan'}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    <button className="btn-icon btn-ghost" onClick={() => openEdit(b.id)}>
                                        <Edit3 size={16} />
                                    </button>
                                    <button className="btn-icon btn-ghost" onClick={() => handleDelete(b.id)}>
                                        <Trash2 size={16} color="var(--danger)" />
                                    </button>
                                </div>
                            </div>
                            <div className="progress-bar" style={{ marginBottom: 'var(--space-sm)' }}>
                                <div
                                    className={`progress-bar-fill ${b.percentage >= 100 ? 'danger' : b.percentage >= 80 ? 'warning' : ''}`}
                                    style={{ width: `${Math.min(b.percentage, 100)}%` }}
                                />
                            </div>
                            <div className="flex-between">
                                <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>
                                    {formatCurrency(b.spent)}
                                </span>
                                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                                    {b.remaining >= 0 ? `Sisa ${formatCurrency(b.remaining)}` : `Lebih ${formatCurrency(-b.remaining)}`}
                                    {' '}/ {formatCurrency(b.limit_amount)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* FAB */}
            <button className="fab" onClick={openAdd}>
                <Plus size={24} />
            </button>

            {/* Modal */}
            <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editId ? 'Edit Budget' : 'Tambah Budget'}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div className="input-group">
                        <label>Kategori</label>
                        <select className="input" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} required>
                            <option value="">Pilih kategori</option>
                            {expenseCategories.map((c) => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-row">
                        <div className="input-group">
                            <label>Limit (Rp)</label>
                            <CurrencyInput value={formLimit} onChange={setFormLimit} placeholder="0" required />
                        </div>
                        <div className="input-group">
                            <label>Periode</label>
                            <select className="input" value={formPeriod} onChange={(e) => setFormPeriod(e.target.value as any)}>
                                <option value="monthly">Bulanan</option>
                                <option value="weekly">Mingguan</option>
                                <option value="yearly">Tahunan</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary btn-full">
                        {editId ? 'Simpan' : 'Tambah Budget'}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
