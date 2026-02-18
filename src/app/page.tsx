'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useFinanceStore } from '@/lib/store';
import { formatCurrency, formatDateShort, getMonthlySpending, getMonthlyIncome, getTotalBalance, getMonthlyTransactions } from '@/lib/helpers';
import { TrendingUp, TrendingDown, Wallet, Plus, ArrowRight, AlertTriangle } from 'lucide-react';
import { format, subDays } from 'date-fns';
import styles from './dashboard.module.css';

// Lazy-load Recharts to avoid SSR issues and improve performance
const AreaChart = dynamic(() => import('recharts').then(m => m.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(m => m.Area), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(m => m.Tooltip), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(m => m.XAxis), { ssr: false });

export default function DashboardPage() {
  const { transactions, budgets, categories, isLoading } = useFinanceStore();
  const router = useRouter();

  const balance = useMemo(() => getTotalBalance(transactions), [transactions]);
  const monthlyIncome = useMemo(() => getMonthlyIncome(transactions), [transactions]);
  const monthlyExpense = useMemo(() => getMonthlySpending(transactions), [transactions]);
  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

  // Budget alerts
  const budgetAlerts = useMemo(() => {
    return budgets
      .map((budget) => {
        const spent = getMonthlySpending(transactions, budget.category);
        const percentage = (spent / budget.limit_amount) * 100;
        const categoryInfo = categories.find((c) => c.name === budget.category);
        return { ...budget, spent, percentage, categoryInfo };
      })
      .filter((b) => b.percentage >= 80)
      .sort((a, b) => b.percentage - a.percentage);
  }, [budgets, transactions, categories]);

  // 7-day spending chart
  const chartData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayExpense = transactions
        .filter((t) => t.type === 'expense' && t.date === dateStr)
        .reduce((sum, t) => sum + t.amount, 0);
      days.push({
        day: format(date, 'EEE'),
        amount: dayExpense,
      });
    }
    return days;
  }, [transactions]);

  const getCategoryColor = (catName: string) => {
    return categories.find((c) => c.name === catName)?.color || '#6c5ce7';
  };

  if (isLoading) {
    return (
      <div className="page">
        <div className="skeleton" style={{ height: 32, width: 180, marginBottom: 24 }} />
        <div className="grid-3" style={{ marginBottom: 24 }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 100 }} />)}
        </div>
        <div className="skeleton" style={{ height: 200, marginBottom: 24 }} />
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid-3" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="stat-card">
          <div className="stat-label">
            <Wallet size={14} style={{ display: 'inline', marginRight: 4 }} />
            Saldo
          </div>
          <div className={`stat-value ${balance >= 0 ? 'income' : 'expense'}`}>
            {formatCurrency(balance)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">
            <TrendingUp size={14} style={{ display: 'inline', marginRight: 4 }} />
            Pemasukan
          </div>
          <div className="stat-value income">{formatCurrency(monthlyIncome)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">
            <TrendingDown size={14} style={{ display: 'inline', marginRight: 4 }} />
            Pengeluaran
          </div>
          <div className="stat-value expense">{formatCurrency(monthlyExpense)}</div>
        </div>
      </div>

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <div className={styles.alertSection}>
          <div className="section-header">
            <h2 className="section-title">⚠️ Peringatan Budget</h2>
          </div>
          {budgetAlerts.map((alert) => (
            <div key={alert.id} className={styles.alertCard}>
              <div className="flex-between">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={16} color={alert.percentage >= 100 ? 'var(--danger)' : 'var(--warning)'} />
                  <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{alert.category}</span>
                </div>
                <span className={`badge ${alert.percentage >= 100 ? 'badge-expense' : 'badge-warning'}`}>
                  {Math.round(alert.percentage)}%
                </span>
              </div>
              <div className="progress-bar" style={{ marginTop: 8 }}>
                <div
                  className={`progress-bar-fill ${alert.percentage >= 100 ? 'danger' : alert.percentage >= 80 ? 'warning' : ''}`}
                  style={{ width: `${Math.min(alert.percentage, 100)}%` }}
                />
              </div>
              <div className="flex-between" style={{ marginTop: 4 }}>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                  {formatCurrency(alert.spent)}
                </span>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                  {formatCurrency(alert.limit_amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Spending Chart */}
      <div className="card-flat" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="section-header">
          <h2 className="section-title">Pengeluaran 7 Hari</h2>
        </div>
        <div style={{ width: '100%', height: 160 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6c5ce7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6c5ce7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6a6a80', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  background: '#1a1a2e',
                  border: '1px solid #2a2a3d',
                  borderRadius: 8,
                  color: '#f0f0f5',
                  fontSize: 12,
                }}
                formatter={(value) => [formatCurrency(value as number), 'Pengeluaran']}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#6c5ce7"
                strokeWidth={2}
                fill="url(#colorAmount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="section-header">
          <h2 className="section-title">Transaksi Terakhir</h2>
          <button className="section-link" onClick={() => router.push('/transactions')}>
            Lihat semua <ArrowRight size={14} style={{ display: 'inline' }} />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="empty-state">
            <Wallet size={48} />
            <p>Belum ada transaksi</p>
            <button className="btn btn-primary btn-sm" onClick={() => router.push('/transactions')}>
              <Plus size={16} /> Tambah Transaksi
            </button>
          </div>
        ) : (
          <div>
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="transaction-item" onClick={() => router.push('/transactions')}>
                <div
                  className="transaction-icon"
                  style={{ background: `${getCategoryColor(tx.category)}22` }}
                >
                  <span style={{ color: getCategoryColor(tx.category), fontSize: 18 }}>
                    {tx.type === 'income' ? '↗' : '↘'}
                  </span>
                </div>
                <div className="transaction-info">
                  <div className="transaction-name">{tx.description || tx.category}</div>
                  <div className="transaction-category">{tx.category}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className={`transaction-amount ${tx.type}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </div>
                  <div className="transaction-date">{formatDateShort(tx.date)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => router.push('/transactions')}>
        <Plus size={24} />
      </button>
    </div>
  );
}
