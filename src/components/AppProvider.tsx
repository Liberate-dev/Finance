'use client';

import { useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useFinanceStore } from '@/lib/store';
import Navigation from './Navigation';
import { ToastProvider } from './Toast';

const AUTH_ROUTES = ['/login', '/auth'];

export default function AppProvider({ children }: { children: ReactNode }) {
    const [isReady, setIsReady] = useState(false);
    const { setUserId, fetchAll } = useFinanceStore();
    const supabase = createClient();
    const pathname = usePathname();
    const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                await fetchAll();
            }
            setIsReady(true);
        };

        init();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                setUserId(session.user.id);
                await fetchAll();
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    if (!isReady) {
        return (
            <div className="loading-screen">
                <div className="spinner" style={{ width: 40, height: 40 }} />
                <p style={{ color: 'var(--text-secondary)' }}>Memuat data...</p>
            </div>
        );
    }

    return (
        <ToastProvider>
            {!isAuthRoute && <Navigation />}
            {children}
        </ToastProvider>
    );
}
