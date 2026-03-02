import { create } from "zustand";
import { persist } from "zustand/middleware";
import { generateId, todayISO } from "./helpers";
import { createClient } from "./supabase/client";
import {
	type Bill,
	type Budget,
	type Category,
	DEFAULT_CATEGORIES,
	type SavingsGoal,
	type Transaction,
} from "./types";

interface FinanceState {
	// Data
	transactions: Transaction[];
	budgets: Budget[];
	categories: Category[];
	bills: Bill[];
	savingsGoals: SavingsGoal[];
	isLoading: boolean;
	userId: string | null;

	// Init
	setUserId: (id: string) => void;
	fetchAll: () => Promise<void>;
	initializeCategories: () => Promise<void>;

	// Transactions
	addTransaction: (
		t: Omit<Transaction, "id" | "user_id" | "created_at">,
	) => Promise<void>;
	updateTransaction: (id: string, t: Partial<Transaction>) => Promise<void>;
	deleteTransaction: (id: string) => Promise<void>;

	// Budgets
	addBudget: (
		b: Omit<Budget, "id" | "user_id" | "created_at">,
	) => Promise<void>;
	updateBudget: (id: string, b: Partial<Budget>) => Promise<void>;
	deleteBudget: (id: string) => Promise<void>;

	// Categories
	addCategory: (c: Omit<Category, "id" | "user_id">) => Promise<void>;
	updateCategory: (id: string, c: Partial<Category>) => Promise<void>;
	deleteCategory: (id: string) => Promise<void>;

	// Bills
	addBill: (b: Omit<Bill, "id" | "user_id" | "created_at">) => Promise<void>;
	updateBill: (id: string, b: Partial<Bill>) => Promise<void>;
	deleteBill: (id: string) => Promise<void>;
	markBillPaid: (id: string) => Promise<void>;

	// Savings Goals
	addSavingsGoal: (
		g: Omit<SavingsGoal, "id" | "user_id" | "created_at">,
	) => Promise<void>;
	updateSavingsGoal: (id: string, g: Partial<SavingsGoal>) => Promise<void>;
	deleteSavingsGoal: (id: string) => Promise<void>;
	addSaving: (id: string, amount: number) => Promise<void>;
}

const supabase = createClient();

const errorMessage = (err: unknown, fallback: string) => {
	if (err && typeof err === "object" && "message" in err) {
		const message = (err as { message?: unknown }).message;
		if (typeof message === "string" && message.trim().length > 0) {
			return message;
		}
	}
	return fallback;
};

export const useFinanceStore = create<FinanceState>()(
	persist(
		(set, get) => ({
			transactions: [],
			budgets: [],
			categories: [],
			bills: [],
			savingsGoals: [],
			isLoading: true,
			userId: null,

			setUserId: (id) => set({ userId: id }),

			fetchAll: async () => {
				const userId = get().userId;
				if (!userId) {
					set({ isLoading: false });
					return;
				}

				set({ isLoading: true });

				try {
					const [transRes, budgetRes, catRes, billRes, goalsRes] =
						await Promise.all([
							supabase
								.from("transactions")
								.select(
									"id, user_id, date, amount, type, category, description, created_at",
								)
								.eq("user_id", userId)
								.order("date", { ascending: false }),
							supabase
								.from("budgets")
								.select(
									"id, user_id, category, limit_amount, period, created_at",
								)
								.eq("user_id", userId),
							supabase
								.from("categories")
								.select("id, user_id, name, icon, color, type")
								.eq("user_id", userId),
							supabase
								.from("bills")
								.select(
									"id, user_id, name, amount, category, frequency, custom_days, due_date, next_due, is_active, remind_days_before, auto_record, created_at",
								)
								.eq("user_id", userId)
								.order("next_due", { ascending: true }),
							supabase
								.from("savings_goals")
								.select(
									"id, user_id, name, target_amount, saved_amount, icon, color, deadline, is_completed, created_at",
								)
								.eq("user_id", userId)
								.order("created_at", { ascending: false }),
						]);

					set({
						transactions: transRes.data || [],
						budgets: budgetRes.data || [],
						categories: catRes.data || [],
						bills: billRes.data || [],
						savingsGoals: goalsRes.data || [],
						isLoading: false,
					});

					// Initialize default categories if none exist
					if (!catRes.data || catRes.data.length === 0) {
						await get().initializeCategories();
					}
				} catch (err) {
					console.warn("fetchAll error:", err);
					set({ isLoading: false });
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

				const { data, error } = await supabase
					.from("categories")
					.insert(cats)
					.select();
				if (error) {
					throw new Error(
						`Gagal inisialisasi kategori: ${errorMessage(error, "Unknown error")}`,
					);
				}
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

				const previous = get().transactions;
				set({ transactions: [newTx, ...previous] });

				const { error } = await supabase.from("transactions").insert(newTx);
				if (error) {
					set({ transactions: previous });
					throw new Error(
						`Gagal menyimpan transaksi: ${errorMessage(error, "Unknown error")}`,
					);
				}
			},

			updateTransaction: async (id, t) => {
				const previous = get().transactions;
				set({
					transactions: previous.map((tx) =>
						tx.id === id ? { ...tx, ...t } : tx,
					),
				});
				const { error } = await supabase
					.from("transactions")
					.update(t)
					.eq("id", id);
				if (error) {
					set({ transactions: previous });
					throw new Error(
						`Gagal memperbarui transaksi: ${errorMessage(error, "Unknown error")}`,
					);
				}
			},

			deleteTransaction: async (id) => {
				const previous = get().transactions;
				set({
					transactions: previous.filter((tx) => tx.id !== id),
				});
				const { error } = await supabase.from("transactions").delete().eq("id", id);
				if (error) {
					set({ transactions: previous });
					throw new Error(
						`Gagal menghapus transaksi: ${errorMessage(error, "Unknown error")}`,
					);
				}
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

				const previous = get().budgets;
				set({ budgets: [...previous, newBudget] });
				const { error } = await supabase.from("budgets").insert(newBudget);
				if (error) {
					set({ budgets: previous });
					throw new Error(
						`Gagal menambah budget: ${errorMessage(error, "Unknown error")}`,
					);
				}
			},

			updateBudget: async (id, b) => {
				const previous = get().budgets;
				set({
					budgets: previous.map((bg) => (bg.id === id ? { ...bg, ...b } : bg)),
				});
				const { error } = await supabase.from("budgets").update(b).eq("id", id);
				if (error) {
					set({ budgets: previous });
					throw new Error(
						`Gagal memperbarui budget: ${errorMessage(error, "Unknown error")}`,
					);
				}
			},

			deleteBudget: async (id) => {
				const previous = get().budgets;
				set({ budgets: previous.filter((bg) => bg.id !== id) });
				const { error } = await supabase.from("budgets").delete().eq("id", id);
				if (error) {
					set({ budgets: previous });
					throw new Error(
						`Gagal menghapus budget: ${errorMessage(error, "Unknown error")}`,
					);
				}
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

				const previous = get().categories;
				set({ categories: [...previous, newCat] });
				const { error } = await supabase.from("categories").insert(newCat);
				if (error) {
					set({ categories: previous });
					throw new Error(
						`Gagal menambah kategori: ${errorMessage(error, "Unknown error")}`,
					);
				}
			},

			updateCategory: async (id, c) => {
				const previous = get().categories;
				set({
					categories: previous.map((cat) =>
						cat.id === id ? { ...cat, ...c } : cat,
					),
				});
				const { error } = await supabase
					.from("categories")
					.update(c)
					.eq("id", id);
				if (error) {
					set({ categories: previous });
					throw new Error(
						`Gagal memperbarui kategori: ${errorMessage(error, "Unknown error")}`,
					);
				}
			},

			deleteCategory: async (id) => {
				const previous = get().categories;
				set({
					categories: previous.filter((cat) => cat.id !== id),
				});
				const { error } = await supabase
					.from("categories")
					.delete()
					.eq("id", id);
				if (error) {
					set({ categories: previous });
					throw new Error(
						`Gagal menghapus kategori: ${errorMessage(error, "Unknown error")}`,
					);
				}
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

				const previous = get().bills;
				set({ bills: [...previous, newBill] });
				const { error } = await supabase.from("bills").insert(newBill);
				if (error) {
					set({ bills: previous });
					throw new Error(
						`Gagal menambah tagihan: ${errorMessage(error, "Unknown error")}`,
					);
				}
			},

			updateBill: async (id, b) => {
				const previous = get().bills;
				set({
					bills: previous.map((bill) =>
						bill.id === id ? { ...bill, ...b } : bill,
					),
				});
				const { error } = await supabase.from("bills").update(b).eq("id", id);
				if (error) {
					set({ bills: previous });
					throw new Error(
						`Gagal memperbarui tagihan: ${errorMessage(error, "Unknown error")}`,
					);
				}
			},

			deleteBill: async (id) => {
				const previous = get().bills;
				set({ bills: previous.filter((bill) => bill.id !== id) });
				const { error } = await supabase.from("bills").delete().eq("id", id);
				if (error) {
					set({ bills: previous });
					throw new Error(
						`Gagal menghapus tagihan: ${errorMessage(error, "Unknown error")}`,
					);
				}
			},

			markBillPaid: async (id) => {
				const bill = get().bills.find((b) => b.id === id);
				if (!bill) return;

				const { getNextDueDate } = await import("./helpers");

				// Auto-record as transaction if enabled
				if (bill.auto_record) {
					await get().addTransaction({
						date: todayISO(),
						amount: bill.amount,
						type: "expense",
						category: bill.category,
						description: `Tagihan: ${bill.name}`,
					});
				}

				// Calculate next due date
				const nextDue = getNextDueDate(
					bill.next_due,
					bill.frequency,
					bill.custom_days,
				);

				await get().updateBill(id, { next_due: nextDue });
			},

			// Savings Goals
			addSavingsGoal: async (g) => {
				const userId = get().userId;
				if (!userId) return;

				const newGoal: SavingsGoal = {
					...g,
					id: generateId(),
					user_id: userId,
					created_at: new Date().toISOString(),
				};

				const previous = get().savingsGoals;
				set({ savingsGoals: [newGoal, ...previous] });
				const { error } = await supabase.from("savings_goals").insert(newGoal);
				if (error) {
					set({ savingsGoals: previous });
					throw new Error(
						`Gagal menambah target: ${errorMessage(error, "Unknown error")}`,
					);
				}
			},

			updateSavingsGoal: async (id, g) => {
				const previous = get().savingsGoals;
				set({
					savingsGoals: previous.map((goal) =>
						goal.id === id ? { ...goal, ...g } : goal,
					),
				});
				const { error } = await supabase
					.from("savings_goals")
					.update(g)
					.eq("id", id);
				if (error) {
					set({ savingsGoals: previous });
					throw new Error(
						`Gagal memperbarui target: ${errorMessage(error, "Unknown error")}`,
					);
				}
			},

			deleteSavingsGoal: async (id) => {
				const previous = get().savingsGoals;
				set({
					savingsGoals: previous.filter((goal) => goal.id !== id),
				});
				const { error } = await supabase
					.from("savings_goals")
					.delete()
					.eq("id", id);
				if (error) {
					set({ savingsGoals: previous });
					throw new Error(
						`Gagal menghapus target: ${errorMessage(error, "Unknown error")}`,
					);
				}
			},

			addSaving: async (id, amount) => {
				const goal = get().savingsGoals.find((g) => g.id === id);
				if (!goal) return;

				const newSaved = goal.saved_amount + amount;
				const isCompleted = newSaved >= goal.target_amount;

				await get().updateSavingsGoal(id, {
					saved_amount: newSaved,
					is_completed: isCompleted,
				});
			},
		}),
		{
			name: "fintrack-store",
			partialize: (state) => ({
				transactions: state.transactions,
				budgets: state.budgets,
				categories: state.categories,
				bills: state.bills,
				savingsGoals: state.savingsGoals,
				userId: state.userId,
			}),
		},
	),
);
