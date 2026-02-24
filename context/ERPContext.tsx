import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { 
  Account, AccountType, Customer, Wallet, Transaction, LedgerEntry, TransactionType,
  CreateCustomerDTO, CreateWalletDTO, PGConfig, TransactionMetadata
} from '../types';
import { INITIAL_ACCOUNTS, INITIAL_CUSTOMERS, INITIAL_WALLETS } from '../constants';
import { formatCurrency, generateId } from '../lib/utils';

interface ERPContextType {
  accounts: Account[];
  customers: Customer[];
  wallets: Wallet[];
  transactions: Transaction[];
  
  // Actions
  postTransaction: (description: string, type: TransactionType, entries: LedgerEntry[], metadata?: TransactionMetadata, date?: string) => void;
  reconcileWallet: (walletId: string, actualBalance: number) => void;
  
  // Masters CRUD
  addCustomer: (data: CreateCustomerDTO) => string; // Returns ID
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  addWallet: (data: CreateWalletDTO) => void;
  addWalletPG: (walletId: string, pgConfig: PGConfig) => void;
  updateWalletPG: (walletId: string, oldPgName: string, pgConfig: PGConfig) => void;

  // Getters
  getAccountBalance: (accountId: string) => number;
  getLedger: (accountId: string) => Transaction[];
  generateBalanceSheet: () => BalanceSheet;
  generateProfitAndLoss: () => ProfitAndLoss;
  
  // Utils
  formatCurrency: (amount: number) => string;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

export const ERPProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [wallets, setWallets] = useState<Wallet[]>(INITIAL_WALLETS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // --- Derived State (Balances) ---
  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    
    // Seed balances
    accounts.forEach(acc => { balances[acc.id] = acc.balance; });

    // Apply transactions
    transactions.forEach(txn => {
      if (txn.status === 'COMPLETED') {
        txn.entries.forEach(entry => {
          const acc = accounts.find(a => a.id === entry.accountId);
          if (!acc) return;

          if (acc.type === AccountType.ASSET || acc.type === AccountType.EXPENSE) {
            balances[acc.id] = (balances[acc.id] || 0) + (entry.debit - entry.credit);
          } else {
            balances[acc.id] = (balances[acc.id] || 0) + (entry.credit - entry.debit);
          }
        });
      }
    });
    return balances;
  }, [transactions, accounts]);

  // --- Actions ---

  const postTransaction = (description: string, type: TransactionType, entries: LedgerEntry[], metadata?: TransactionMetadata, dateStr?: string) => {
    // 1. Double-Entry Validation
    const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      const errorMsg = `Transaction Unbalanced! Dr: ${totalDebit.toFixed(2)}, Cr: ${totalCredit.toFixed(2)}`;
      console.error(errorMsg);
      alert(errorMsg);
      return;
    }

    if (entries.length < 2) {
      alert("A transaction must have at least two entries (Debit and Credit).");
      return;
    }

    // 2. Account Validation
    const invalidAccounts = entries.filter(e => !accounts.some(a => a.id === e.accountId));
    if (invalidAccounts.length > 0) {
      alert(`Invalid Account IDs: ${invalidAccounts.map(e => e.accountId).join(', ')}`);
      return;
    }

    const newTxn: Transaction = {
      id: crypto.randomUUID(),
      date: dateStr || new Date().toISOString(),
      description,
      type,
      entries,
      status: 'COMPLETED',
      metadata
    };

    setTransactions(prev => [newTxn, ...prev]);
  };

  const addCustomer = (data: CreateCustomerDTO): string => {
    const ledgerId = generateId('L');
    const customerId = generateId('C');

    const newAccount: Account = {
      id: ledgerId,
      name: `${data.name} Payable`,
      type: AccountType.LIABILITY,
      category: 'Customer',
      balance: 0
    };

    const newCustomer: Customer = {
      id: customerId,
      name: data.name,
      phone: data.phone,
      commissionRates: data.commissionRates,
      ledgerAccountId: ledgerId,
      joinedAt: new Date().toISOString()
    };

    // Atomic update
    setAccounts(prev => [...prev, newAccount]);
    setCustomers(prev => [...prev, newCustomer]);
    
    return customerId;
  };

  const updateCustomer = (id: string, data: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, ...data };
      }
      return c;
    }));
  };

  const addWallet = (data: CreateWalletDTO) => {
    const ledgerId = generateId('A');
    const walletId = generateId('W');

    const newAccount: Account = {
      id: ledgerId,
      name: data.name,
      type: AccountType.ASSET,
      category: 'Wallet',
      balance: 0
    };

    const newWallet: Wallet = {
      id: walletId,
      name: data.name,
      ledgerAccountId: ledgerId,
      pgs: [{
        name: data.pgName,
        charges: data.charges
      }]
    };

    // Atomic update
    setAccounts(prev => [...prev, newAccount]);
    setWallets(prev => [...prev, newWallet]);
  };

  const addWalletPG = (walletId: string, pgConfig: PGConfig) => {
    setWallets(prev => prev.map(w => {
      if (w.id === walletId) {
        return { ...w, pgs: [...w.pgs, pgConfig] };
      }
      return w;
    }));
  };

  const updateWalletPG = (walletId: string, oldPgName: string, pgConfig: PGConfig) => {
    setWallets(prev => prev.map(w => {
      if (w.id === walletId) {
        return { 
          ...w, 
          pgs: w.pgs.map(pg => pg.name === oldPgName ? pgConfig : pg) 
        };
      }
      return w;
    }));
  };

  const reconcileWallet = (walletId: string, actualBalance: number) => {
    const wallet = wallets.find(w => w.id === walletId);
    if (!wallet) return;

    const systemBalance = accountBalances[wallet.ledgerAccountId] || 0;
    const difference = actualBalance - systemBalance;

    if (Math.abs(difference) < 0.01) return; 

    const entries: LedgerEntry[] = [];
    
    if (difference < 0) {
      // Shortage (Expense)
      entries.push({ accountId: 'E002', debit: Math.abs(difference), credit: 0 });
      entries.push({ accountId: wallet.ledgerAccountId, debit: 0, credit: Math.abs(difference) });
      postTransaction(`Reconciliation: Shortage - ${wallet.name}`, TransactionType.RECONCILIATION, entries, { walletId });
    } else {
      // Surplus (Income)
      entries.push({ accountId: wallet.ledgerAccountId, debit: difference, credit: 0 });
      entries.push({ accountId: 'I002', debit: 0, credit: difference });
      postTransaction(`Reconciliation: Surplus - ${wallet.name}`, TransactionType.RECONCILIATION, entries, { walletId });
    }
  };

  // Getters
  const getAccountBalance = (accountId: string) => accountBalances[accountId] || 0;
  const getLedger = (accountId: string) => transactions.filter(txn => txn.entries.some(e => e.accountId === accountId));

  const generateProfitAndLoss = (): ProfitAndLoss => {
    const income = accounts
      .filter(a => a.type === AccountType.INCOME)
      .map(a => ({ account: a, balance: getAccountBalance(a.id) }));
    
    const expenses = accounts
      .filter(a => a.type === AccountType.EXPENSE)
      .map(a => ({ account: a, balance: getAccountBalance(a.id) }));

    const totalIncome = income.reduce((sum, item) => sum + item.balance, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.balance, 0);
    const netProfit = totalIncome - totalExpenses;

    return { income, expenses, totalIncome, totalExpenses, netProfit };
  };

  const generateBalanceSheet = (): BalanceSheet => {
    const pl = generateProfitAndLoss();
    
    const assets = accounts
      .filter(a => a.type === AccountType.ASSET)
      .map(a => ({ account: a, balance: getAccountBalance(a.id) }));
    
    const liabilities = accounts
      .filter(a => a.type === AccountType.LIABILITY && a.category !== 'Equity')
      .map(a => ({ account: a, balance: getAccountBalance(a.id) }));
    
    const equity = accounts
      .filter(a => a.category === 'Equity')
      .map(a => {
        let balance = getAccountBalance(a.id);
        // Add net profit to Retained Earnings for reporting
        if (a.id === 'Q002') {
          balance += pl.netProfit;
        }
        return { account: a, balance };
      });

    const totalAssets = assets.reduce((sum, item) => sum + item.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, item) => sum + item.balance, 0);
    const totalEquity = equity.reduce((sum, item) => sum + item.balance, 0);

    return { assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity };
  };

  return (
    <ERPContext.Provider value={{
      accounts,
      customers,
      wallets,
      transactions,
      postTransaction,
      getAccountBalance,
      getLedger,
      formatCurrency,
      reconcileWallet,
      addCustomer,
      updateCustomer,
      addWallet,
      addWalletPG,
      updateWalletPG,
      generateBalanceSheet,
      generateProfitAndLoss
    }}>
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) throw new Error("useERP must be used within ERPProvider");
  return context;
};
