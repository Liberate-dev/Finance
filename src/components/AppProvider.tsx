'use client';

import { useEffect, useState, useRef, ReactNode } from 'react';
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
    const hasFetched = useRef(false);

    useEffect(() => {
        let mounted = true;

        const loadUser = async (userId: string) => {
            if (hasFetched.current) return; // Prevent double-fetch
            hasFetched.current = true;
            setUserId(userId);
            try {
                await fetchAll();
            } catch (err) {
                console.warn('Data fetch failed:', err);
            }
            if (mounted) setIsReady(true);
        };

        // 1. Quick initial check using cached session (no network call)
        const initSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!mounted) return;

                if (session?.user) {
                    await loadUser(session.user.id);
                } else {
                    setIsReady(true);
                }
            } catch {
                if (mounted) setIsReady(true);
            }
        };

        initSession();

        // 2. Listen for auth changes (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user) {
                    hasFetched.current = false; // Reset for fresh fetch
                    await loadUser(session.user.id);
                } else if (event === 'SIGNED_OUT') {
                    hasFetched.current = false;
                    setUserId('');
                }
            }
        );

        // 3. Safety timeout — show app after 3s max
        const timeout = setTimeout(() => {
            if (mounted && !isReady) {
                console.warn('Init timeout — showing app');
                setIsReady(true);
            }
        }, 3000);

        return () => {
            mounted = false;
            clearTimeout(timeout);
            subscription.unsubscribe();
        };
    }, []); // No dependencies — only run once

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

