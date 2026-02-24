
export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum TransactionType {
  SWIPE_PAY = 'SWIPE_PAY',
  PAY_SWIPE = 'PAY_SWIPE',
  MONEY_TRANSFER = 'MONEY_TRANSFER',
  JOURNAL = 'JOURNAL',
  RECONCILIATION = 'RECONCILIATION',
}

export type AccountCategory = 'Cash' | 'Bank' | 'Wallet' | 'Customer' | 'Revenue' | 'Expense' | 'Equity';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  category: AccountCategory;
  balance: number; // Current calculated balance
}

export interface Rates {
  visa: number;
  master: number;
  amex: number;
  rupay: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  commissionRates: Rates;
  ledgerAccountId: string;
  joinedAt?: string;
}

export interface PGConfig {
  name: string;
  charges: Rates;
}

export interface Wallet {
  id: string;
  name: string;
  ledgerAccountId: string;
  pgs: PGConfig[];
}

export interface LedgerEntry {
  accountId: string;
  debit: number;
  credit: number;
}

export interface TransactionMetadata {
  customerId?: string;
  walletId?: string;
  cardType?: string;
  relatedTransactionId?: string;
}

export interface Transaction {
  id: string;
  date: string; // ISO String
  description: string;
  type: TransactionType;
  entries: LedgerEntry[];
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  referenceId?: string; // e.g. Customer ID
  metadata?: TransactionMetadata;
}

// DTOs
export interface CreateCustomerDTO {
  name: string;
  phone: string;
  commissionRates: Rates;
}

export interface CreateWalletDTO {
  name: string;
  pgName: string;
  charges: Rates;
}

export interface BalanceSheet {
  assets: { account: Account; balance: number }[];
  liabilities: { account: Account; balance: number }[];
  equity: { account: Account; balance: number }[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

export interface ProfitAndLoss {
  income: { account: Account; balance: number }[];
  expenses: { account: Account; balance: number }[];
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
}
