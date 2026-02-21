import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, addDays, addWeeks, addMonths, addYears, differenceInDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { Transaction, Bill, BillFrequency } from './types';

// Currency formatting
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

// Short currency (e.g., 1.5jt)
export function formatCurrencyShort(amount: number): string {
    if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}M`;
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}jt`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}rb`;
    return amount.toString();
}

// Date formatting
export function formatDate(dateStr: string): string {
    return format(parseISO(dateStr), 'd MMM yyyy', { locale: id });
}

export function formatDateShort(dateStr: string): string {
    return format(parseISO(dateStr), 'd MMM', { locale: id });
}

export function formatMonthYear(dateStr: string): string {
    return format(parseISO(dateStr), 'MMMM yyyy', { locale: id });
}

// Get current month's transactions
export function getMonthlyTransactions(transactions: Transaction[], monthDate?: Date): Transaction[] {
    const target = monthDate || new Date();
    const start = startOfMonth(target);
    const end = endOfMonth(target);

    return transactions.filter((t) =>
        isWithinInterval(parseISO(t.date), { start, end })
    );
}

// Calculate monthly spending, optionally by category
export function getMonthlySpending(transactions: Transaction[], category?: string, monthDate?: Date): number {
    const monthly = getMonthlyTransactions(transactions, monthDate);
    return monthly
        .filter((t) => t.type === 'expense' && (!category || t.category === category))
        .reduce((sum, t) => sum + t.amount, 0);
}

// Calculate monthly income
export function getMonthlyIncome(transactions: Transaction[], monthDate?: Date): number {
    const monthly = getMonthlyTransactions(transactions, monthDate);
    return monthly
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
}

// Calculate total balance
export function getTotalBalance(transactions: Transaction[]): number {
    return transactions.reduce((sum, t) => {
        return t.type === 'income' ? sum + t.amount : sum - t.amount;
    }, 0);
}

// Single-pass monthly stats: computes income, total expense, and per-category expense in one iteration
export function getMonthlyStats(transactions: Transaction[], monthDate?: Date): {
    income: number;
    expense: number;
    byCategory: Record<string, number>;
} {
    const target = monthDate || new Date();
    const start = startOfMonth(target);
    const end = endOfMonth(target);

    const result = { income: 0, expense: 0, byCategory: {} as Record<string, number> };

    for (const t of transactions) {
        const d = parseISO(t.date);
        if (!isWithinInterval(d, { start, end })) continue;

        if (t.type === 'income') {
            result.income += t.amount;
        } else {
            result.expense += t.amount;
            result.byCategory[t.category] = (result.byCategory[t.category] || 0) + t.amount;
        }
    }

    return result;
}

// Calculate next due date for a bill
export function getNextDueDate(currentDue: string, frequency: BillFrequency, customDays?: number): string {
    const date = parseISO(currentDue);
    let next: Date;

    switch (frequency) {
        case 'weekly':
            next = addWeeks(date, 1);
            break;
        case 'monthly':
            next = addMonths(date, 1);
            break;
        case 'yearly':
            next = addYears(date, 1);
            break;
        case 'custom':
            next = addDays(date, customDays || 30);
            break;
        default:
            next = addMonths(date, 1);
    }

    return format(next, 'yyyy-MM-dd');
}

// Get bill status
export function getBillStatus(bill: Bill): 'overdue' | 'due-soon' | 'upcoming' {
    const today = new Date();
    const dueDate = parseISO(bill.next_due);
    const daysUntil = differenceInDays(dueDate, today);

    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= bill.remind_days_before) return 'due-soon';
    return 'upcoming';
}

// Generate UUID
export function generateId(): string {
    return crypto.randomUUID();
}

// Get today's date as ISO string
export function todayISO(): string {
    return format(new Date(), 'yyyy-MM-dd');
}

// Parse receipt text for amount
export function parseReceiptAmount(text: string): number | null {
    const patterns = [
        /(?:total|jumlah|grand\s*total|amount)\s*[:\s]*(?:rp\.?\s*)?([0-9.,]+)/i,
        /(?:rp\.?\s*)([0-9.,]+)/i,
        /([0-9]{1,3}(?:[.,][0-9]{3})+)/,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            const numStr = match[1].replace(/[.,]/g, '');
            const num = parseInt(numStr, 10);
            if (num > 0 && num < 100_000_000) return num;
        }
    }
    return null;
}

// Parse receipt text for date
export function parseReceiptDate(text: string): string | null {
    const patterns = [
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
        /(\d{1,2})\s*(jan|feb|mar|apr|mei|jun|jul|agu|sep|okt|nov|des)\w*\s*(\d{2,4})/i,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            try {
                let day: number, month: number, year: number;
                if (match[2].match(/[a-z]/i)) {
                    day = parseInt(match[1]);
                    const monthNames: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, mei: 5, jun: 6, jul: 7, agu: 8, sep: 9, okt: 10, nov: 11, des: 12 };
                    month = monthNames[match[2].toLowerCase().slice(0, 3)] || 1;
                    year = parseInt(match[3]);
                } else {
                    day = parseInt(match[1]);
                    month = parseInt(match[2]);
                    year = parseInt(match[3]);
                }
                if (year < 100) year += 2000;
                return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            } catch {
                continue;
            }
        }
    }
    return null;
}
