'use client';

import { useMemo, useState } from 'react';
import { useFinanceStore } from '@/lib/store';
import { formatCurrency, getMonthlySpending, getMonthlyIncome } from '@/lib/helpers';
import {
    PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    Tooltip, LineChart, Line, CartesianGrid,
} from 'recharts';
import { format, subMonths } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { BarChart3 } from 'lucide-react';

export default function ReportsPage() {
    const { transactions, categories } = useFinanceStore();
    const [activeTab, setActiveTab] = useState<'overview' | 'category' | 'trend'>('overview');

    // Monthly category breakdown (pie chart)
    const categoryData = useMemo(() => {
        const expenseCats = categories.filter((c) => c.type === 'expense');
        return expenseCats
            .map((cat) => ({
                name: cat.name,
                value: getMonthlySpending(transactions, cat.name),
                color: cat.color,
            }))
            .filter((d) => d.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [transactions, categories]);

    // 6-month trend
    const trendData = useMemo(() => {
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const monthDate = subMonths(new Date(), i);
            months.push({
                month: format(monthDate, 'MMM', { locale: idLocale }),
                income: getMonthlyIncome(transactions, monthDate),
                expense: getMonthlySpending(transactions, undefined, monthDate),
            });
        }
        return months;
    }, [transactions]);

    const totalMonthExpense = useMemo(() => getMonthlySpending(transactions), [transactions]);
    const totalMonthIncome = useMemo(() => getMonthlyIncome(transactions), [transactions]);

    const tooltipStyle = {
        contentStyle: {
            background: '#1a1a2e',
            border: '1px solid #2a2a3d',
            borderRadius: 8,
            color: '#f0f0f5',
            fontSize: 12,
        },
    };

    return (
        <div className="page">
            <h1 className="page-title">Laporan</h1>

            {/* Summary */}
            <div className="grid-2" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="stat-card">
                    <div className="stat-label">Pemasukan Bulan Ini</div>
                    <div className="stat-value income" style={{ fontSize: 'var(--font-xl)' }}>{formatCurrency(totalMonthIncome)}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Pengeluaran Bulan Ini</div>
                    <div className="stat-value expense" style={{ fontSize: 'var(--font-xl)' }}>{formatCurrency(totalMonthExpense)}</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tab-bar" style={{ marginBottom: 'var(--space-lg)' }}>
                <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Kategori</button>
                <button className={`tab ${activeTab === 'trend' ? 'active' : ''}`} onClick={() => setActiveTab('trend')}>Tren</button>
                <button className={`tab ${activeTab === 'category' ? 'active' : ''}`} onClick={() => setActiveTab('category')}>Bar Chart</button>
            </div>

            {activeTab === 'overview' && (
                <div className="card-flat">
                    <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
                        Pengeluaran per Kategori
                    </h3>
                    {categoryData.length === 0 ? (
                        <div className="empty-state">
                            <BarChart3 size={48} />
                            <p>Belum ada data pengeluaran</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ width: '100%', height: 250 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {categoryData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            {...tooltipStyle}
                                            formatter={(value) => [formatCurrency(value as number), '']}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                                {categoryData.map((d) => (
                                    <div key={d.name} className="flex-between" style={{ padding: '6px 0' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{ width: 12, height: 12, borderRadius: 3, background: d.color }} />
                                            <span style={{ fontSize: 'var(--font-sm)' }}>{d.name}</span>
                                        </div>
                                        <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{formatCurrency(d.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {activeTab === 'trend' && (
                <div className="card-flat">
                    <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
                        Tren 6 Bulan
                    </h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3d" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6a6a80', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6a6a80', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                                <Tooltip {...tooltipStyle} formatter={(value) => [formatCurrency(value as number), '']} />
                                <Line type="monotone" dataKey="income" stroke="#00b894" strokeWidth={2} dot={{ fill: '#00b894', r: 4 }} name="Pemasukan" />
                                <Line type="monotone" dataKey="expense" stroke="#ff6b6b" strokeWidth={2} dot={{ fill: '#ff6b6b', r: 4 }} name="Pengeluaran" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {activeTab === 'category' && (
                <div className="card-flat">
                    <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
                        Pengeluaran per Kategori
                    </h3>
                    {categoryData.length === 0 ? (
                        <div className="empty-state">
                            <BarChart3 size={48} />
                            <p>Belum ada data</p>
                        </div>
                    ) : (
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={categoryData} layout="vertical">
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6a6a80', fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}rb`} />
                                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#a0a0b8', fontSize: 12 }} width={80} />
                                    <Tooltip {...tooltipStyle} formatter={(value) => [formatCurrency(value as number), '']} />
                                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                                        {categoryData.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
