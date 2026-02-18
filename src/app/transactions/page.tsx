'use client';

import { useState, useMemo } from 'react';
import { useFinanceStore } from '@/lib/store';
import { formatCurrency, formatDate, todayISO } from '@/lib/helpers';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import {
    Plus, Search, Filter, Trash2, Edit3, X,
} from 'lucide-react';
import CurrencyInput from '@/components/CurrencyInput';
import styles from './transactions.module.css';

type FilterType = 'all' | 'income' | 'expense';

export default function TransactionsPage() {
    const { transactions, categories, addTransaction, updateTransaction, deleteTransaction } = useFinanceStore();
    const { showToast } = useToast();

    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [filterCategory, setFilterCategory] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    // Form state
    const [formDate, setFormDate] = useState(todayISO());
    const [formAmount, setFormAmount] = useState('');
    const [formType, setFormType] = useState<'income' | 'expense'>('expense');
    const [formCategory, setFormCategory] = useState('');
    const [formDescription, setFormDescription] = useState('');

    const filteredCategories = useMemo(
        () => categories.filter((c) => c.type === formType),
        [categories, formType]
    );

    const filtered = useMemo(() => {
        return transactions.filter((t) => {
            if (filterType !== 'all' && t.type !== filterType) return false;
            if (filterCategory && t.category !== filterCategory) return false;
            if (search) {
                const q = search.toLowerCase();
                return t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
            }
            return true;
        });
    }, [transactions, filterType, filterCategory, search]);

    const getCategoryColor = (name: string) =>
        categories.find((c) => c.name === name)?.color || '#6c5ce7';

    const resetForm = () => {
        setFormDate(todayISO());
        setFormAmount('');
        setFormType('expense');
        setFormCategory('');
        setFormDescription('');
        setEditId(null);
    };

    const openAdd = () => {
        resetForm();
        setShowModal(true);
    };

    const openEdit = (id: string) => {
        const tx = transactions.find((t) => t.id === id);
        if (!tx) return;
        setFormDate(tx.date);
        setFormAmount(tx.amount.toString());
        setFormType(tx.type);
        setFormCategory(tx.category);
        setFormDescription(tx.description);
        setEditId(id);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formCategory) {
            showToast('Pilih kategori!', 'error');
            return;
        }

        const data = {
            date: formDate,
            amount: parseFloat(formAmount),
            type: formType,
            category: formCategory,
            description: formDescription,
        };

        if (editId) {
            await updateTransaction(editId, data);
            showToast('Transaksi diperbarui');
        } else {
            await addTransaction(data);
            showToast('Transaksi ditambahkan');
        }

        setShowModal(false);
        resetForm();
    };

    const handleDelete = async (id: string) => {
        await deleteTransaction(id);
        setShowDeleteConfirm(null);
        showToast('Transaksi dihapus');
    };

    // Group by date
    const grouped = useMemo(() => {
        const groups: Record<string, typeof filtered> = {};
        filtered.forEach((t) => {
            if (!groups[t.date]) groups[t.date] = [];
            groups[t.date].push(t);
        });
        return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
    }, [filtered]);

    return (
        <div className="page">
            <h1 className="page-title">Transaksi</h1>

            {/* Search & Filters */}
            <div className={styles.filters}>
                <div className={styles.searchBox}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        className="input"
                        style={{ paddingLeft: 40 }}
                        placeholder="Cari transaksi..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="tab-bar">
                    {(['all', 'income', 'expense'] as FilterType[]).map((f) => (
                        <button
                            key={f}
                            className={`tab ${filterType === f ? 'active' : ''}`}
                            onClick={() => setFilterType(f)}
                        >
                            {f === 'all' ? 'Semua' : f === 'income' ? 'Masuk' : 'Keluar'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Transaction List */}
            {grouped.length === 0 ? (
                <div className="empty-state">
                    <Search size={48} />
                    <p>{search ? 'Tidak ada hasil pencarian' : 'Belum ada transaksi'}</p>
                    <button className="btn btn-primary btn-sm" onClick={openAdd}>
                        <Plus size={16} /> Tambah
                    </button>
                </div>
            ) : (
                grouped.map(([date, txs]) => (
                    <div key={date} className={styles.dateGroup}>
                        <div className={styles.dateLabel}>{formatDate(date)}</div>
                        {txs.map((tx) => (
                            <div key={tx.id} className="transaction-item">
                                <div
                                    className="transaction-icon"
                                    style={{ background: `${getCategoryColor(tx.category)}22` }}
                                >
                                    <span style={{ color: getCategoryColor(tx.category), fontSize: 18 }}>
                                        {tx.type === 'income' ? '↗' : '↘'}
                                    </span>
                                </div>
                                <div className="transaction-info" onClick={() => openEdit(tx.id)}>
                                    <div className="transaction-name">{tx.description || tx.category}</div>
                                    <div className="transaction-category">{tx.category}</div>
                                </div>
                                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div>
                                        <div className={`transaction-amount ${tx.type}`}>
                                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                        </div>
                                    </div>
                                    <button
                                        className="btn-icon btn-ghost"
                                        style={{ padding: 6 }}
                                        onClick={() => setShowDeleteConfirm(tx.id)}
                                    >
                                        <Trash2 size={16} color="var(--danger)" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ))
            )}

            {/* Add/Edit FAB */}
            <button className="fab" onClick={openAdd}>
                <Plus size={24} />
            </button>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => { setShowModal(false); resetForm(); }}
                title={editId ? 'Edit Transaksi' : 'Tambah Transaksi'}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {/* Type Toggle */}
                    <div className="tab-bar">
                        <button
                            type="button"
                            className={`tab ${formType === 'expense' ? 'active' : ''}`}
                            onClick={() => { setFormType('expense'); setFormCategory(''); }}
                        >
                            Pengeluaran
                        </button>
                        <button
                            type="button"
                            className={`tab ${formType === 'income' ? 'active' : ''}`}
                            onClick={() => { setFormType('income'); setFormCategory(''); }}
                        >
                            Pemasukan
                        </button>
                    </div>

                    <div className="form-row">
                        <div className="input-group">
                            <label>Tanggal</label>
                            <input type="date" className="input" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label>Jumlah (Rp)</label>
                            <CurrencyInput
                                value={formAmount}
                                onChange={setFormAmount}
                                placeholder="0"
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Kategori</label>
                        <div className="category-grid">
                            {filteredCategories.map((cat) => (
                                <button
                                    type="button"
                                    key={cat.id}
                                    className={`category-option ${formCategory === cat.name ? 'selected' : ''}`}
                                    onClick={() => setFormCategory(cat.name)}
                                >
                                    <div className="category-dot" style={{ background: `${cat.color}22` }}>
                                        <span style={{ color: cat.color, fontSize: 16 }}>●</span>
                                    </div>
                                    <span>{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Catatan</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="Makan siang, belanja, dll..."
                            value={formDescription}
                            onChange={(e) => setFormDescription(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-full">
                        {editId ? 'Simpan Perubahan' : 'Tambah Transaksi'}
                    </button>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <Modal
                isOpen={!!showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(null)}
                title="Hapus Transaksi?"
            >
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
                    Transaksi ini akan dihapus permanen. Yakin?
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowDeleteConfirm(null)}>
                        Batal
                    </button>
                    <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(showDeleteConfirm!)}>
                        Hapus
                    </button>
                </div>
            </Modal>
        </div>
    );
}
