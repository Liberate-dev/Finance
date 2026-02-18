import { create } from 'zustand';
import { Transaction, Budget, Category, Bill, DEFAULT_CATEGORIES } from './types';
import { createClient } from './supabase/client';
import { generateId, todayISO } from './helpers';

interface FinanceState {
    // Data
    transactions: Transaction[];
    budgets: Budget[];
    categories: Category[];
    bills: Bill[];
    isLoading: boolean;
    userId: string | null;

    // Init
    setUserId: (id: string) => void;
    fetchAll: () => Promise<void>;
    initializeCategories: () => Promise<void>;

    // Transactions
    addTransaction: (t: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
    updateTransaction: (id: string, t: Partial<Transaction>) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;

    // Budgets
    addBudget: (b: Omit<Budget, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
    updateBudget: (id: string, b: Partial<Budget>) => Promise<void>;
    deleteBudget: (id: string) => Promise<void>;

    // Categories
    addCategory: (c: Omit<Category, 'id' | 'user_id'>) => Promise<void>;
    updateCategory: (id: string, c: Partial<Category>) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;

    // Bills
    addBill: (b: Omit<Bill, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
    updateBill: (id: string, b: Partial<Bill>) => Promise<void>;
    deleteBill: (id: string) => Promise<void>;
    markBillPaid: (id: string) => Promise<void>;
}

const supabase = createClient();

export const useFinanceStore = create<FinanceState>((set, get) => ({
    transactions: [],
    budgets: [],
    categories: [],
    bills: [],
    isLoading: true,
    userId: null,

    setUserId: (id) => set({ userId: id }),

    fetchAll: async () => {
        const userId = get().userId;
        if (!userId) return;

        set({ isLoading: true });

        const [transRes, budgetRes, catRes, billRes] = await Promise.all([
            supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
            supabase.from('budgets').select('*').eq('user_id', userId),
            supabase.from('categories').select('*').eq('user_id', userId),
            supabase.from('bills').select('*').eq('user_id', userId).order('next_due', { ascending: true }),
        ]);

        set({
            transactions: transRes.data || [],
            budgets: budgetRes.data || [],
            categories: catRes.data || [],
            bills: billRes.data || [],
            isLoading: false,
        });

        // Initialize default categories if none exist
        if (!catRes.data || catRes.data.length === 0) {
            await get().initializeCategories();
        }
    },

    initializeCategories: async () => {
        const userId = get().userId;
        if (!userId) return;

        const cats = DEFAULT_CATEGORIES.map((c) => ({
            ...c,
            id: generateId(),
            user_id: userId,
        }));

        const { data } = await supabase.from('categories').insert(cats).select();
        if (data) set({ categories: data });
    },

    // Transactions
    addTransaction: async (t) => {
        const userId = get().userId;
        if (!userId) return;

        const newTx: Transaction = {
            ...t,
            id: generateId(),
            user_id: userId,
            created_at: new Date().toISOString(),
        };

        // Optimistic update
        set((s) => ({ transactions: [newTx, ...s.transactions] }));
        await supabase.from('transactions').insert(newTx);
    },

    updateTransaction: async (id, t) => {
        set((s) => ({
            transactions: s.transactions.map((tx) => (tx.id === id ? { ...tx, ...t } : tx)),
        }));
        await supabase.from('transactions').update(t).eq('id', id);
    },

    deleteTransaction: async (id) => {
        set((s) => ({ transactions: s.transactions.filter((tx) => tx.id !== id) }));
        await supabase.from('transactions').delete().eq('id', id);
    },

    // Budgets
    addBudget: async (b) => {
        const userId = get().userId;
        if (!userId) return;

        const newBudget: Budget = {
            ...b,
            id: generateId(),
            user_id: userId,
            created_at: new Date().toISOString(),
        };

        set((s) => ({ budgets: [...s.budgets, newBudget] }));
        await supabase.from('budgets').insert(newBudget);
    },

    updateBudget: async (id, b) => {
        set((s) => ({
            budgets: s.budgets.map((bg) => (bg.id === id ? { ...bg, ...b } : bg)),
        }));
        await supabase.from('budgets').update(b).eq('id', id);
    },

    deleteBudget: async (id) => {
        set((s) => ({ budgets: s.budgets.filter((bg) => bg.id !== id) }));
        await supabase.from('budgets').delete().eq('id', id);
    },

    // Categories
    addCategory: async (c) => {
        const userId = get().userId;
        if (!userId) return;

        const newCat: Category = {
            ...c,
            id: generateId(),
            user_id: userId,
        };

        set((s) => ({ categories: [...s.categories, newCat] }));
        await supabase.from('categories').insert(newCat);
    },

    updateCategory: async (id, c) => {
        set((s) => ({
            categories: s.categories.map((cat) => (cat.id === id ? { ...cat, ...c } : cat)),
        }));
        await supabase.from('categories').update(c).eq('id', id);
    },

    deleteCategory: async (id) => {
        set((s) => ({ categories: s.categories.filter((cat) => cat.id !== id) }));
        await supabase.from('categories').delete().eq('id', id);
    },

    // Bills
    addBill: async (b) => {
        const userId = get().userId;
        if (!userId) return;

        const newBill: Bill = {
            ...b,
            id: generateId(),
            user_id: userId,
            created_at: new Date().toISOString(),
        };

        set((s) => ({ bills: [...s.bills, newBill] }));
        await supabase.from('bills').insert(newBill);
    },

    updateBill: async (id, b) => {
        set((s) => ({
            bills: s.bills.map((bill) => (bill.id === id ? { ...bill, ...b } : bill)),
        }));
        await supabase.from('bills').update(b).eq('id', id);
    },

    deleteBill: async (id) => {
        set((s) => ({ bills: s.bills.filter((bill) => bill.id !== id) }));
        await supabase.from('bills').delete().eq('id', id);
    },

    markBillPaid: async (id) => {
        const bill = get().bills.find((b) => b.id === id);
        if (!bill) return;

        const { getNextDueDate } = await import('./helpers');

        // Auto-record as transaction if enabled
        if (bill.auto_record) {
            await get().addTransaction({
                date: todayISO(),
                amount: bill.amount,
                type: 'expense',
                category: bill.category,
                description: `Tagihan: ${bill.name}`,
            });
        }

        // Calculate next due date
        const nextDue = getNextDueDate(bill.next_due, bill.frequency, bill.custom_days);

        await get().updateBill(id, { next_due: nextDue });
    },
}));
