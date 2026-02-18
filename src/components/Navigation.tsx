'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ArrowLeftRight,
    FileText,
    ScanLine,
    MoreHorizontal,
    Target,
    BarChart3,
    Settings,
    LogOut,
    PiggyBank,
} from 'lucide-react';
import styles from './Navigation.module.css';

const bottomTabs = [
    { href: '/', icon: LayoutDashboard, label: 'Home' },
    { href: '/transactions', icon: ArrowLeftRight, label: 'Transaksi' },
    { href: '/goals', icon: PiggyBank, label: 'Target' },
    { href: '/bills', icon: FileText, label: 'Tagihan' },
    { href: '/more', icon: MoreHorizontal, label: 'Lainnya' },
];

const sidebarLinks = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/transactions', icon: ArrowLeftRight, label: 'Transaksi' },
    { href: '/bills', icon: FileText, label: 'Tagihan' },
    { href: '/budget', icon: Target, label: 'Budget' },
    { href: '/goals', icon: PiggyBank, label: 'Target' },
    { href: '/scan', icon: ScanLine, label: 'Scan Receipt' },
    { href: '/reports', icon: BarChart3, label: 'Laporan' },
    { href: '/settings', icon: Settings, label: 'Pengaturan' },
];

export default function Navigation() {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* Sidebar - Desktop */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarBrand}>
                    <div className={styles.brandIcon}>💰</div>
                    <span className={styles.brandText}>FinTrack</span>
                </div>

                <nav className={styles.sidebarNav}>
                    {sidebarLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`${styles.sidebarLink} ${isActive(link.href) ? styles.active : ''}`}
                        >
                            <link.icon size={20} />
                            <span>{link.label}</span>
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Bottom Tab Bar - Mobile */}
            <nav className={styles.bottomNav}>
                {bottomTabs.map((tab) => (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={`${styles.bottomTab} ${isActive(tab.href) ? styles.active : ''}`}
                    >
                        <tab.icon size={22} />
                        <span>{tab.label}</span>
                    </Link>
                ))}
            </nav>
        </>
    );
}
