'use client';

import { useState, useMemo } from 'react';
import { useFinanceStore } from '@/lib/store';
import { formatCurrency } from '@/lib/helpers';
import CurrencyInput from '@/components/CurrencyInput';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';
import { Plus, Target, Trash2, Edit3, PiggyBank, Gift, CheckCircle, Calendar, TrendingUp } from 'lucide-react';

const GOAL_ICONS = [
    { icon: '🎯', label: 'Target' },
    { icon: '📱', label: 'Gadget' },
    { icon: '🏠', label: 'Rumah' },
    { icon: '🚗', label: 'Kendaraan' },
    { icon: '✈️', label: 'Liburan' },
    { icon: '🎓', label: 'Pendidikan' },
    { icon: '💻', label: 'Laptop' },
    { icon: '🎮', label: 'Gaming' },
    { icon: '👟', label: 'Fashion' },
    { icon: '💍', label: 'Perhiasan' },
    { icon: '📷', label: 'Kamera' },
    { icon: '🎵', label: 'Musik' },
];

const GOAL_COLORS = [
    '#6c5ce7', '#00b894', '#e17055', '#fdcb6e',
    '#74b9ff', '#a29bfe', '#ff6b6b', '#55efc4',
    '#fd79a8', '#00cec9', '#e84393', '#0984e3',
];

export default function GoalsPage() {
    const { savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, addSaving } = useFinanceStore();
    const { showToast } = useToast();

    const [showModal, setShowModal] = useState(false);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [depositGoalId, setDepositGoalId] = useState<string | null>(null);

    // Form state
    const [formName, setFormName] = useState('');
    const [formTarget, setFormTarget] = useState('');
    const [formIcon, setFormIcon] = useState('🎯');
    const [formColor, setFormColor] = useState('#6c5ce7');
    const [formDeadline, setFormDeadline] = useState('');
    const [depositAmount, setDepositAmount] = useState('');

    // Stats
    const stats = useMemo(() => {
        const active = savingsGoals.filter(g => !g.is_completed);
        const completed = savingsGoals.filter(g => g.is_completed);
        const totalSaved = savingsGoals.reduce((sum, g) => sum + g.saved_amount, 0);
        const totalTarget = savingsGoals.reduce((sum, g) => sum + g.target_amount, 0);
        return { active: active.length, completed: completed.length, totalSaved, totalTarget };
    }, [savingsGoals]);

    const resetForm = () => {
        setFormName('');
        setFormTarget('');
        setFormIcon('🎯');
        setFormColor('#6c5ce7');
        setFormDeadline('');
        setEditId(null);
    };

    const openAdd = () => {
        resetForm();
        setShowModal(true);
    };

    const openEdit = (id: string) => {
        const goal = savingsGoals.find(g => g.id === id);
        if (!goal) return;
        setFormName(goal.name);
        setFormTarget(String(goal.target_amount));
        setFormIcon(goal.icon);
        setFormColor(goal.color);
        setFormDeadline(goal.deadline || '');
        setEditId(id);
        setShowModal(true);
    };

    const openDeposit = (id: string) => {
        setDepositGoalId(id);
        setDepositAmount('');
        setShowDepositModal(true);
    };

    const handleSave = async () => {
        if (!formName.trim() || !formTarget) return;

        const data = {
            name: formName.trim(),
            target_amount: Number(formTarget),
            saved_amount: 0,
            icon: formIcon,
            color: formColor,
            deadline: formDeadline || undefined,
            is_completed: false,
        };

        if (editId) {
            const { saved_amount, is_completed, ...updateData } = data;
            await updateSavingsGoal(editId, updateData);
            showToast('Target berhasil diperbarui');
        } else {
            await addSavingsGoal(data);
            showToast('Target baru ditambahkan! 🎯');
        }

        setShowModal(false);
        resetForm();
    };

    const handleDeposit = async () => {
        if (!depositGoalId || !depositAmount || Number(depositAmount) <= 0) return;

        await addSaving(depositGoalId, Number(depositAmount));
        const goal = savingsGoals.find(g => g.id === depositGoalId);
        const newTotal = (goal?.saved_amount || 0) + Number(depositAmount);
        const isComplete = goal && newTotal >= goal.target_amount;

        if (isComplete) {
            showToast('🎉 Target tercapai! Selamat!');
        } else {
            showToast(`Berhasil menambah Rp ${Number(depositAmount).toLocaleString('id-ID')}`);
        }

        setShowDepositModal(false);
        setDepositGoalId(null);
    };

    const handleDelete = async (id: string) => {
        await deleteSavingsGoal(id);
        showToast('Target dihapus');
    };

    const getProgress = (saved: number, target: number) => {
        return Math.min((saved / target) * 100, 100);
    };

    const getRemainder = (saved: number, target: number) => {
        return Math.max(target - saved, 0);
    };

    return (
        <div className="page">
            <div className="flex-between" style={{ marginBottom: 'var(--space-lg)' }}>
                <h1 className="page-title" style={{ margin: 0 }}>Target Tabungan</h1>
                <button className="btn btn-primary btn-sm" onClick={openAdd}>
                    <Plus size={16} /> Tambah
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid-3" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="stat-card">
                    <div className="stat-label">
                        <TrendingUp size={14} style={{ display: 'inline', marginRight: 4 }} />
                        Total Ditabung
                    </div>
                    <div className="stat-value income">{formatCurrency(stats.totalSaved)}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">
                        <Target size={14} style={{ display: 'inline', marginRight: 4 }} />
                        Aktif
                    </div>
                    <div className="stat-value">{stats.active}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">
                        <CheckCircle size={14} style={{ display: 'inline', marginRight: 4 }} />
                        Tercapai
                    </div>
                    <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.completed}</div>
                </div>
            </div>

            {/* Goals List */}
            {savingsGoals.length === 0 ? (
                <div className="empty-state">
                    <PiggyBank size={48} />
                    <p>Belum ada target tabungan</p>
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                        Buat target untuk mulai menabung!
                    </p>
                    <button className="btn btn-primary btn-sm" onClick={openAdd}>
                        <Plus size={16} /> Buat Target Pertama
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {savingsGoals.map((goal) => {
                        const progress = getProgress(goal.saved_amount, goal.target_amount);
                        const remainder = getRemainder(goal.saved_amount, goal.target_amount);

                        return (
                            <div
                                key={goal.id}
                                className="card-flat"
                                style={{
                                    borderLeft: `4px solid ${goal.color}`,
                                    opacity: goal.is_completed ? 0.8 : 1,
                                }}
                            >
                                {/* Header */}
                                <div className="flex-between" style={{ marginBottom: 'var(--space-sm)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                        <span style={{ fontSize: 28 }}>{goal.icon}</span>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 'var(--font-md)' }}>
                                                {goal.name}
                                                {goal.is_completed && (
                                                    <span style={{ marginLeft: 8, color: 'var(--success)', fontSize: 'var(--font-xs)' }}>
                                                        ✅ Tercapai!
                                                    </span>
                                                )}
                                            </div>
                                            {goal.deadline && (
                                                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                    <Calendar size={12} />
                                                    Deadline: {new Date(goal.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button className="btn-icon btn-ghost" onClick={() => openEdit(goal.id)}>
                                            <Edit3 size={16} />
                                        </button>
                                        <button className="btn-icon btn-ghost" onClick={() => handleDelete(goal.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="progress-bar" style={{ marginBottom: 'var(--space-sm)', height: 12, borderRadius: 6 }}>
                                    <div
                                        style={{
                                            width: `${progress}%`,
                                            height: '100%',
                                            borderRadius: 6,
                                            background: goal.is_completed
                                                ? 'var(--success)'
                                                : `linear-gradient(90deg, ${goal.color}, ${goal.color}cc)`,
                                            transition: 'width 0.5s ease',
                                        }}
                                    />
                                </div>

                                {/* Amount Info */}
                                <div className="flex-between" style={{ marginBottom: 'var(--space-sm)' }}>
                                    <div>
                                        <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: goal.color }}>
                                            {formatCurrency(goal.saved_amount)}
                                        </span>
                                        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)' }}>
                                            {' '}/ {formatCurrency(goal.target_amount)}
                                        </span>
                                    </div>
                                    <span className={`badge ${goal.is_completed ? 'badge-income' : 'badge-default'}`}>
                                        {Math.round(progress)}%
                                    </span>
                                </div>

                                {/* Remainder + Add Button */}
                                {!goal.is_completed && (
                                    <div className="flex-between" style={{ paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--border)' }}>
                                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                                            Kurang {formatCurrency(remainder)}
                                        </span>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => openDeposit(goal.id)}
                                            style={{ fontSize: 'var(--font-xs)', padding: '6px 12px' }}
                                        >
                                            <Plus size={14} /> Tambah Tabungan
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* FAB */}
            <button className="fab" onClick={openAdd}>
                <Plus size={24} />
            </button>

            {/* Add/Edit Goal Modal */}
            <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editId ? 'Edit Target' : 'Target Baru'}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div className="input-group">
                        <label>Nama Target</label>
                        <input
                            className="input"
                            placeholder="e.g. iPhone 16, Motor Baru, Liburan Bali"
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Target Harga (Rp)</label>
                        <CurrencyInput value={formTarget} onChange={setFormTarget} placeholder="0" required />
                    </div>

                    <div className="input-group">
                        <label>Deadline (opsional)</label>
                        <input
                            type="date"
                            className="input"
                            value={formDeadline}
                            onChange={(e) => setFormDeadline(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label>Ikon</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                            {GOAL_ICONS.map((item) => (
                                <button
                                    key={item.icon}
                                    type="button"
                                    onClick={() => setFormIcon(item.icon)}
                                    style={{
                                        padding: 8,
                                        fontSize: 24,
                                        borderRadius: 'var(--radius-sm)',
                                        border: formIcon === item.icon ? `2px solid var(--accent)` : '2px solid var(--border)',
                                        background: formIcon === item.icon ? 'var(--accent-dim)' : 'var(--bg-input)',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                    }}
                                    title={item.label}
                                >
                                    {item.icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Warna</label>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {GOAL_COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setFormColor(c)}
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        background: c,
                                        border: formColor === c ? '3px solid white' : '3px solid transparent',
                                        cursor: 'pointer',
                                        boxShadow: formColor === c ? `0 0 0 2px ${c}` : 'none',
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <button className="btn btn-primary btn-full" onClick={handleSave}>
                        {editId ? 'Simpan Perubahan' : 'Buat Target'} 🎯
                    </button>
                </div>
            </Modal>

            {/* Deposit Modal */}
            <Modal
                isOpen={showDepositModal}
                onClose={() => { setShowDepositModal(false); setDepositGoalId(null); }}
                title="Tambah Tabungan"
            >
                {depositGoalId && (() => {
                    const goal = savingsGoals.find(g => g.id === depositGoalId);
                    if (!goal) return null;
                    const remainder = getRemainder(goal.saved_amount, goal.target_amount);

                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            <div style={{ textAlign: 'center', padding: 'var(--space-md)', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)' }}>
                                <span style={{ fontSize: 40 }}>{goal.icon}</span>
                                <div style={{ fontWeight: 600, marginTop: 8 }}>{goal.name}</div>
                                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)', marginTop: 4 }}>
                                    Sisa target: {formatCurrency(remainder)}
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Jumlah yang ditabung (Rp)</label>
                                <CurrencyInput value={depositAmount} onChange={setDepositAmount} placeholder="0" required />
                            </div>

                            {/* Quick amounts */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                {[50000, 100000, 250000].map((amt) => (
                                    <button
                                        key={amt}
                                        type="button"
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => setDepositAmount(String(amt))}
                                        style={{ fontSize: 'var(--font-xs)' }}
                                    >
                                        {formatCurrency(amt)}
                                    </button>
                                ))}
                                {[500000, 1000000].map((amt) => (
                                    <button
                                        key={amt}
                                        type="button"
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => setDepositAmount(String(amt))}
                                        style={{ fontSize: 'var(--font-xs)' }}
                                    >
                                        {formatCurrency(amt)}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setDepositAmount(String(remainder))}
                                    style={{ fontSize: 'var(--font-xs)', color: 'var(--success)' }}
                                >
                                    Lunasi
                                </button>
                            </div>

                            <button className="btn btn-primary btn-full" onClick={handleDeposit}>
                                <PiggyBank size={18} /> Simpan
                            </button>
                        </div>
                    );
                })()}
            </Modal>
        </div>
    );
}
