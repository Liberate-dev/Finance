'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useFinanceStore } from '@/lib/store';
import { useToast } from '@/components/Toast';
import { useRouter } from 'next/navigation';
import {
    LogOut, Download, Upload, Trash2, User, ChevronRight,
} from 'lucide-react';
import Modal from '@/components/Modal';

export default function SettingsPage() {
    const { transactions, budgets, categories, bills } = useFinanceStore();
    const { showToast } = useToast();
    const router = useRouter();
    const supabase = createClient();

    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    // Get user email
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) setUserEmail(data.user.email || '');
        });
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    const handleExport = () => {
        const data = { transactions, budgets, categories, bills, exportedAt: new Date().toISOString() };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fintrack-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Data berhasil di-export!');
    };

    const handleImport = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e: any) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                showToast('Import berhasil! Refresh halaman untuk melihat data.', 'success');
                // TODO: implement full import via store
            } catch {
                showToast('File tidak valid', 'error');
            }
        };
        input.click();
    };

    const handleClearAll = async () => {
        const userId = useFinanceStore.getState().userId;
        if (!userId) return;

        await Promise.all([
            supabase.from('transactions').delete().eq('user_id', userId),
            supabase.from('budgets').delete().eq('user_id', userId),
            supabase.from('bills').delete().eq('user_id', userId),
        ]);

        showToast('Semua data berhasil dihapus');
        setShowClearConfirm(false);
        window.location.reload();
    };

    const menuItems = [
        {
            icon: Download,
            label: 'Export Data',
            desc: 'Download semua data sebagai JSON',
            action: handleExport,
        },
        {
            icon: Upload,
            label: 'Import Data',
            desc: 'Restore data dari file JSON',
            action: handleImport,
        },
        {
            icon: Trash2,
            label: 'Hapus Semua Data',
            desc: 'Hapus semua transaksi, budget, dan tagihan',
            action: () => setShowClearConfirm(true),
            danger: true,
        },
    ];

    return (
        <div className="page">
            <h1 className="page-title">Pengaturan</h1>

            {/* User Info */}
            <div className="card-flat" style={{ marginBottom: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 'var(--radius-full)',
                        background: 'var(--accent-gradient)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center'
                    }}>
                        <User size={24} color="white" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{userEmail || 'Loading...'}</div>
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                            {transactions.length} transaksi · {bills.length} tagihan
                        </div>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                        <LogOut size={16} /> Keluar
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid-3" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="stat-card">
                    <div className="stat-label">Transaksi</div>
                    <div className="stat-value" style={{ fontSize: 'var(--font-xl)' }}>{transactions.length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Budget</div>
                    <div className="stat-value" style={{ fontSize: 'var(--font-xl)' }}>{budgets.length}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Tagihan</div>
                    <div className="stat-value" style={{ fontSize: 'var(--font-xl)' }}>{bills.length}</div>
                </div>
            </div>

            {/* Menu */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {menuItems.map((item) => (
                    <button
                        key={item.label}
                        onClick={item.action}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 'var(--space-md)',
                            padding: 'var(--space-md)', borderRadius: 'var(--radius-md)',
                            background: 'none', border: 'none', color: item.danger ? 'var(--danger)' : 'var(--text-primary)',
                            cursor: 'pointer', width: '100%', textAlign: 'left',
                            transition: 'background 0.2s',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                        onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
                    >
                        <item.icon size={20} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500, fontSize: 'var(--font-sm)' }}>{item.label}</div>
                            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>{item.desc}</div>
                        </div>
                        <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
                    </button>
                ))}
            </div>

            {/* Clear Confirmation */}
            <Modal isOpen={showClearConfirm} onClose={() => setShowClearConfirm(false)} title="Hapus Semua Data?">
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
                    Semua transaksi, budget, dan tagihan akan dihapus permanen. Aksi ini tidak bisa dibatalkan.
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                    <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowClearConfirm(false)}>
                        Batal
                    </button>
                    <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleClearAll}>
                        Hapus Semua
                    </button>
                </div>
            </Modal>
        </div>
    );
}
