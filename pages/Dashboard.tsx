import React from 'react';
import { useERP } from '../context/ERPContext';
import { Layout } from '../components/Layout';
import { Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const Dashboard: React.FC = () => {
  const { accounts, wallets, formatCurrency, getAccountBalance } = useERP();

  // Metrics
  const totalCash = getAccountBalance('A001');
  const totalBank = getAccountBalance('A002') + getAccountBalance('A003');
  const totalWallet = wallets.reduce((sum, w) => sum + getAccountBalance(w.ledgerAccountId), 0);
  const totalIncome = getAccountBalance('I001') + getAccountBalance('I002');

  const walletData = wallets.map(w => ({
    name: w.name,
    balance: getAccountBalance(w.ledgerAccountId)
  }));

  return (
    <Layout title="Financial Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard 
          title="Total Cash" 
          amount={formatCurrency(totalCash)} 
          icon={<DollarSign className="text-green-600" />} 
          trend="+2.5%" 
        />
        <MetricCard 
          title="Total Bank Balance" 
          amount={formatCurrency(totalBank)} 
          icon={<TrendingUp className="text-blue-600" />} 
          trend="+0.8%" 
        />
        <MetricCard 
          title="Total Wallet Balance" 
          amount={formatCurrency(totalWallet)} 
          icon={<Wallet className="text-purple-600" />} 
          trend="-1.2%" 
        />
        <MetricCard 
          title="Revenue (YTD)" 
          amount={formatCurrency(totalIncome)} 
          icon={<TrendingUp className="text-emerald-600" />} 
          trend="+12%" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 text-slate-800">Wallet Liquidity Overview</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={walletData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="balance" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 text-slate-800">Quick Actions</h2>
          <div className="space-y-3">
             <button className="w-full text-left px-4 py-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition flex items-center gap-2 font-medium">
                <TrendingUp size={18} /> Daily Reconciliation
             </button>
             <button className="w-full text-left px-4 py-3 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition flex items-center gap-2 font-medium">
                <Wallet size={18} /> Transfer Cash to Bank
             </button>
             <button className="w-full text-left px-4 py-3 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition flex items-center gap-2 font-medium">
                <TrendingDown size={18} /> Record Expense
             </button>
          </div>

          <h2 className="text-lg font-semibold mt-8 mb-4 text-slate-800">System Alerts</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
               <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0"></div>
               <p>Wallet B is running low on balance (Below ₹10,000).</p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
               <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5 shrink-0"></div>
               <p>3 Transactions pending approval.</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const MetricCard = ({ title, amount, icon, trend }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1">{amount}</h3>
      </div>
      <div className="p-3 bg-gray-50 rounded-lg">
        {icon}
      </div>
    </div>
    <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
      {trend} <span className="text-slate-400 font-normal">vs last month</span>
    </div>
  </div>
);
