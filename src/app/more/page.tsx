'use client';

import Link from 'next/link';
import { Target, BarChart3, Settings } from 'lucide-react';

export default function MorePage() {
    const links = [
        { href: '/budget', icon: Target, label: 'Budget', desc: 'Atur batas pengeluaran per kategori' },
        { href: '/reports', icon: BarChart3, label: 'Laporan', desc: 'Lihat grafik dan analisis keuangan' },
        { href: '/settings', icon: Settings, label: 'Pengaturan', desc: 'Akun, export data, dan lainnya' },
    ];

    return (
        <div className="page">
            <h1 className="page-title">Lainnya</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {links.map((link) => (
                    <Link key={link.href} href={link.href} className="card-flat" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', textDecoration: 'none', cursor: 'pointer' }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 'var(--radius-md)',
                            background: 'rgba(108, 92, 231, 0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--accent-primary-light)',
                        }}>
                            <link.icon size={22} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 600 }}>{link.label}</div>
                            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>{link.desc}</div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
