'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import styles from './login.module.css';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                window.location.href = '/';
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setSuccess('Akun berhasil dibuat! Cek email untuk verifikasi.');
            }
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.loginCard}>
                {/* Brand */}
                <div className={styles.brand}>
                    <div className={styles.brandIcon}>💰</div>
                    <h1 className={styles.brandName}>FinTrack</h1>
                    <p className={styles.brandTagline}>Kelola keuangan pribadi dengan cerdas</p>
                </div>

                {/* Toggle */}
                <div className="tab-bar" style={{ marginBottom: 'var(--space-lg)' }}>
                    <button className={`tab ${isLogin ? 'active' : ''}`} onClick={() => setIsLogin(true)}>
                        Masuk
                    </button>
                    <button className={`tab ${!isLogin ? 'active' : ''}`} onClick={() => setIsLogin(false)}>
                        Daftar
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className="input-group">
                        <label>Email</label>
                        <div className={styles.inputWrapper}>
                            <Mail size={18} className={styles.inputIcon} />
                            <input
                                type="email"
                                className="input"
                                style={{ paddingLeft: 44 }}
                                placeholder="email@contoh.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <div className={styles.inputWrapper}>
                            <Lock size={18} className={styles.inputIcon} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="input"
                                style={{ paddingLeft: 44, paddingRight: 44 }}
                                placeholder="Minimal 6 karakter"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                className={styles.eyeButton}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && <div className={styles.error}>{error}</div>}
                    {success && <div className={styles.success}>{success}</div>}

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? (
                            <div className="spinner" style={{ width: 20, height: 20 }} />
                        ) : (
                            <>
                                {isLogin ? 'Masuk' : 'Buat Akun'}
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
