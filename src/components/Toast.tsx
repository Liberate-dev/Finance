'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error';
}

interface ToastContextType {
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be inside ToastProvider');
    return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        const id = crypto.randomUUID();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const dismiss = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="toast-container">
                {toasts.map((toast) => (
                    <div key={toast.id} className={`toast toast-${toast.type}`}>
                        {toast.type === 'success' ? (
                            <CheckCircle size={18} color="var(--success)" />
                        ) : (
                            <XCircle size={18} color="var(--danger)" />
                        )}
                        <span style={{ flex: 1 }}>{toast.message}</span>
                        <button onClick={() => dismiss(toast.id)} style={{ opacity: 0.5 }}>
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
