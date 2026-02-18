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
        // On auth routes (login/register), skip fetching user data — show UI immediately
        if (isAuthRoute) {
            setIsReady(true);
            return;
        }

        let mounted = true;

        const init = async () => {
            try {
                const { data: { user }, error } = await supabase.auth.getUser();
                if (!mounted) return;

                if (error) {
                    console.warn('Auth check failed:', error.message);
                    setIsReady(true);
                    return;
                }

                if (user) {
                    setUserId(user.id);
                    try {
                        await fetchAll();
                    } catch (fetchErr) {
                        console.warn('Data fetch failed:', fetchErr);
                    }
                }
            } catch (err) {
                console.warn('Init error:', err);
            } finally {
                if (mounted) setIsReady(true);
            }
        };

        init();

        // Safety timeout — if init takes too long, show the app anyway
        const timeout = setTimeout(() => {
            if (!isReady && mounted) {
                console.warn('Init timeout — showing app anyway');
                setIsReady(true);
            }
        }, 5000);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                setUserId(session.user.id);
                try {
                    await fetchAll();
                } catch (err) {
                    console.warn('Auth state fetch failed:', err);
                }
            }
        });

        return () => {
            mounted = false;
            clearTimeout(timeout);
            subscription.unsubscribe();
        };
    }, [isAuthRoute]);

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
