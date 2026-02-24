import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { Layout } from '../components/Layout';
import { Card, CardHeader, CardContent } from '../components/ui/Elements';
import { Transaction, TransactionType } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell } from 'recharts';
import { TrendingUp, TrendingDown, ReceiptText, User, CreditCard, Wallet as WalletIcon, Scale, FileText } from 'lucide-react';

type ReportTab = 'overview' | 'balance-sheet' | 'pl' | 'transactions' | 'card' | 'wallet' | 'customer';

export const Reports: React.FC = () => {
  const { transactions, wallets, customers, formatCurrency, generateBalanceSheet, generateProfitAndLoss } = useERP();
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');

  const balanceSheet = generateBalanceSheet();
  const plReport = generateProfitAndLoss();

  // --- Aggregation Logic ---
  const calculatePL = (txns: Transaction[]) => {
    let income = 0;
    let expense = 0;
    txns.forEach(t => {
      t.entries.forEach(e => {
        if (e.accountId === 'I001' || e.accountId === 'I002') income += e.credit;
        if (['E001', 'E002', 'E003'].includes(e.accountId)) expense += e.debit;
      });
    });
    return { income, expense, profit: income - expense };
  };

  const cardStats = ['visa', 'master', 'amex', 'rupay'].map(type => {
    const subset = transactions.filter(t => t.metadata?.cardType === type);
    const { income, expense, profit } = calculatePL(subset);
    return { name: type.toUpperCase(), income, expense, profit, count: subset.length };
  });

  const walletStats = wallets.map(w => {
    const subset = transactions.filter(t => t.metadata?.walletId === w.id);
    const { income, expense, profit } = calculatePL(subset);
    return { name: w.name, income, expense, profit, count: subset.length };
  });

  const customerStats = customers.map(c => {
    const subset = transactions.filter(t => t.metadata?.customerId === c.id);
    const { income, expense, profit } = calculatePL(subset);
    return { 
      id: c.id, 
      name: c.name, 
      profit, 
      count: subset.filter(t => t.type === TransactionType.SWIPE_PAY).length 
    };
  }).sort((a, b) => b.profit - a.profit).slice(0, 10);

  const txnPL = transactions
    .filter(t => t.type === TransactionType.SWIPE_PAY && t.metadata?.walletId)
    .map(t => {
      const customer = customers.find(c => c.id === t.metadata?.customerId);
      const { income, expense, profit } = calculatePL([t]);
      return { 
        id: t.id,
        date: t.date,
        customer: customer?.name || 'Unknown',
        wallet: wallets.find(w => w.id === t.metadata?.walletId)?.name || 'N/A',
        card: t.metadata?.cardType?.toUpperCase() || 'N/A',
        revenue: income,
        cost: expense,
        profit: profit
      };
    });

  const totalPL = calculatePL(transactions);

  return (
    <Layout title="Business Analytics & P&L Engine">
      
      <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg border border-gray-200 overflow-x-auto">
        <TabButton id="overview" label="Performance" icon={TrendingUp} active={activeTab} onClick={setActiveTab} />
        <TabButton id="pl" label="Profit & Loss" icon={FileText} active={activeTab} onClick={setActiveTab} />
        <TabButton id="balance-sheet" label="Balance Sheet" icon={Scale} active={activeTab} onClick={setActiveTab} />
        <TabButton id="transactions" label="Transaction P&L" icon={ReceiptText} active={activeTab} onClick={setActiveTab} />
        <TabButton id="card" label="By Network" icon={CreditCard} active={activeTab} onClick={setActiveTab} />
        <TabButton id="wallet" label="By Wallet" icon={WalletIcon} active={activeTab} onClick={setActiveTab} />
        <TabButton id="customer" label="Top Customers" icon={User} active={activeTab} onClick={setActiveTab} />
      </div>

      <div className="animate-fade-in space-y-6">
        
        {activeTab === 'pl' && (
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader title="Profit & Loss Statement" subtitle="For the current period" />
              <div className="p-6 space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Income</h3>
                  <DataTable 
                    headers={['Account', 'Amount']}
                    rows={plReport.income.map(i => [i.account.name, formatCurrency(i.balance)])}
                  />
                  <div className="flex justify-between p-4 bg-slate-50 font-bold text-slate-900">
                    <span>Total Income</span>
                    <span>{formatCurrency(plReport.totalIncome)}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Expenses</h3>
                  <DataTable 
                    headers={['Account', 'Amount']}
                    rows={plReport.expenses.map(e => [e.account.name, formatCurrency(e.balance)])}
                  />
                  <div className="flex justify-between p-4 bg-slate-50 font-bold text-slate-900">
                    <span>Total Expenses</span>
                    <span>{formatCurrency(plReport.totalExpenses)}</span>
                  </div>
                </div>

                <div className={`flex justify-between p-6 rounded-xl font-black text-xl ${plReport.netProfit >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  <span>Net Profit / (Loss)</span>
                  <span>{formatCurrency(plReport.netProfit)}</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'balance-sheet' && (
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader title="Balance Sheet" subtitle="As of today" />
              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-slate-900 border-b-2 border-slate-900 pb-2">Assets</h3>
                  <DataTable 
                    headers={['Account', 'Balance']}
                    rows={balanceSheet.assets.map(a => [a.account.name, formatCurrency(a.balance)])}
                  />
                  <div className="flex justify-between p-4 bg-slate-900 text-white font-bold rounded-lg">
                    <span>Total Assets</span>
                    <span>{formatCurrency(balanceSheet.totalAssets)}</span>
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 border-b-2 border-slate-900 pb-2">Liabilities</h3>
                    <DataTable 
                      headers={['Account', 'Balance']}
                      rows={balanceSheet.liabilities.map(l => [l.account.name, formatCurrency(l.balance)])}
                    />
                    <div className="flex justify-between p-4 bg-slate-100 text-slate-900 font-bold rounded-lg mt-2">
                      <span>Total Liabilities</span>
                      <span>{formatCurrency(balanceSheet.totalLiabilities)}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-900 border-b-2 border-slate-900 pb-2">Equity</h3>
                    <DataTable 
                      headers={['Account', 'Balance']}
                      rows={balanceSheet.equity.map(e => [e.account.name, formatCurrency(e.balance)])}
                    />
                    <div className="flex justify-between p-4 bg-slate-100 text-slate-900 font-bold rounded-lg mt-2">
                      <span>Total Equity</span>
                      <span>{formatCurrency(balanceSheet.totalEquity)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between p-4 bg-slate-900 text-white font-bold rounded-lg">
                    <span>Total Liabilities & Equity</span>
                    <span>{formatCurrency(balanceSheet.totalLiabilities + balanceSheet.totalEquity)}</span>
                  </div>
                  
                  {Math.abs(balanceSheet.totalAssets - (balanceSheet.totalLiabilities + balanceSheet.totalEquity)) > 0.01 && (
                    <div className="p-4 bg-red-100 text-red-700 rounded-lg font-bold text-center">
                      Warning: Balance Sheet is not in equilibrium!
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
        {activeTab === 'overview' && (
           <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard title="Gross Operating Revenue" value={formatCurrency(totalPL.income)} icon={<TrendingUp className="text-green-500"/>} color="text-green-600" />
                <KPICard title="Total Direct Costs (MDR)" value={formatCurrency(totalPL.expense)} icon={<TrendingDown className="text-red-500"/>} color="text-red-600" />
                <KPICard title="Net Net Profit" value={formatCurrency(totalPL.profit)} icon={<TrendingUp className="text-blue-500"/>} color="text-blue-600" bg="bg-blue-50/50" />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader title="Network Profitability Breakdown" />
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={cardStats}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" fontSize={11} axisLine={false} tickLine={false} />
                        <YAxis fontSize={11} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                        <Bar dataKey="profit" name="Net Profit" fill="#3b82f6" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader title="Top 10 Profitable Clients" />
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={customerStats} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" fontSize={11} axisLine={false} />
                        <YAxis type="category" dataKey="name" fontSize={11} width={80} axisLine={false} />
                        <Tooltip />
                        <Bar dataKey="profit" fill="#10b981" radius={[0,4,4,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
           </>
        )}

        {activeTab === 'transactions' && (
          <Card>
            <CardHeader title="Individual Transaction Profitability" subtitle="Real-time margin analysis per swipe" />
            <DataTable 
              headers={['Date', 'Customer', 'Card/Wallet', 'Revenue', 'Cost', 'Net Profit']}
              rows={txnPL.map(t => [
                new Date(t.date).toLocaleDateString(),
                t.customer,
                <div className="text-xs"><span className="font-bold">{t.card}</span> • {t.wallet}</div>,
                formatCurrency(t.revenue),
                formatCurrency(t.cost),
                <span className={`font-bold ${t.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(t.profit)}</span>
              ])}
            />
          </Card>
        )}

        {activeTab === 'card' && (
          <Card>
            <CardHeader title="P&L by Card Network" />
            <DataTable 
              headers={['Network', 'Total Swipes', 'Gross Revenue', 'Network Cost', 'Net Contribution']}
              rows={cardStats.map(s => [
                <span className="font-bold">{s.name}</span>,
                s.count,
                formatCurrency(s.income),
                formatCurrency(s.expense),
                <span className="font-bold text-blue-600">{formatCurrency(s.profit)}</span>
              ])}
            />
          </Card>
        )}

        {activeTab === 'wallet' && (
          <Card>
            <CardHeader title="P&L by Provider/Wallet" />
            <DataTable 
              headers={['Wallet', 'Total Volume', 'MDR Expense', 'Margin']}
              rows={walletStats.map(s => [
                <span className="font-bold">{s.name}</span>,
                formatCurrency(s.income),
                formatCurrency(s.expense),
                <span className="font-bold text-green-600">{formatCurrency(s.profit)}</span>
              ])}
            />
          </Card>
        )}
      </div>
    </Layout>
  );
};

const TabButton = ({ id, label, icon: Icon, active, onClick }: any) => (
  <button
    onClick={() => onClick(id)}
    className={`flex items-center gap-2 px-4 py-2 font-medium text-sm rounded-md transition-all whitespace-nowrap ${
      active === id ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-gray-500 hover:bg-gray-50'
    }`}
  >
    <Icon size={16} />
    {label}
  </button>
);

const KPICard = ({ title, value, icon, color, bg }: any) => (
  <div className={`p-6 rounded-xl border border-gray-100 shadow-sm ${bg || 'bg-white'} flex items-center justify-between`}>
    <div>
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</p>
      <p className={`text-2xl font-black mt-1 ${color}`}>{value}</p>
    </div>
    <div className="p-3 bg-white rounded-lg shadow-inner">{icon}</div>
  </div>
);

const DataTable = ({ headers, rows }: { headers: string[], rows: any[][] }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm text-left">
      <thead className="bg-slate-50 text-slate-500 font-bold border-b">
        <tr>{headers.map((h, i) => <th key={i} className="p-4">{h}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.length === 0 ? (
          <tr><td colSpan={headers.length} className="p-10 text-center text-gray-400">No data available for this report.</td></tr>
        ) : (
          rows.map((row, i) => (
            <tr key={i} className="hover:bg-slate-50/50">
              {row.map((cell, j) => <td key={j} className="p-4 text-slate-700">{cell}</td>)}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);
