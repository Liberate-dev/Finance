export type TransactionType = 'income' | 'expense';
export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly';
export type BillFrequency = 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface Category {
    id: string;
    user_id: string;
    name: string;
    icon: string;
    color: string;
    type: TransactionType;
}

export interface Transaction {
    id: string;
    user_id: string;
    date: string;
    amount: number;
    type: TransactionType;
    category: string;
    description: string;
    receipt_url?: string;
    created_at: string;
}

export interface Budget {
    id: string;
    user_id: string;
    category: string;
    limit_amount: number;
    period: BudgetPeriod;
    created_at: string;
}

export interface Bill {
    id: string;
    user_id: string;
    name: string;
    amount: number;
    category: string;
    frequency: BillFrequency;
    custom_days?: number;
    due_date: string;
    next_due: string;
    is_active: boolean;
    remind_days_before: number;
    auto_record: boolean;
    created_at: string;
}

export interface SavingsGoal {
    id: string;
    user_id: string;
    name: string;
    target_amount: number;
    saved_amount: number;
    icon: string;
    color: string;
    deadline?: string;
    is_completed: boolean;
    created_at: string;
}

export interface AppUser {
    id: string;
    email: string;
}

// Default categories
export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'user_id'>[] = [
    { name: 'Makanan', icon: 'utensils', color: '#FF6B6B', type: 'expense' },
    { name: 'Transport', icon: 'car', color: '#4ECDC4', type: 'expense' },
    { name: 'Belanja', icon: 'shopping-bag', color: '#45B7D1', type: 'expense' },
    { name: 'Hiburan', icon: 'gamepad-2', color: '#96CEB4', type: 'expense' },
    { name: 'Tagihan', icon: 'receipt', color: '#FFEAA7', type: 'expense' },
    { name: 'Kesehatan', icon: 'heart-pulse', color: '#DDA0DD', type: 'expense' },
    { name: 'Pendidikan', icon: 'graduation-cap', color: '#74B9FF', type: 'expense' },
    { name: 'Lainnya', icon: 'ellipsis', color: '#636E72', type: 'expense' },
    { name: 'Gaji', icon: 'banknote', color: '#00B894', type: 'income' },
    { name: 'Freelance', icon: 'laptop', color: '#6C5CE7', type: 'income' },
    { name: 'Investasi', icon: 'trending-up', color: '#FDCB6E', type: 'income' },
    { name: 'Lain-lain', icon: 'plus-circle', color: '#A29BFE', type: 'income' },
];
