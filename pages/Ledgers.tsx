import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { Layout } from '../components/Layout';
import { Transaction } from '../types';
import { X, Info } from 'lucide-react';

export const Ledgers: React.FC = () => {
  const { accounts, transactions, getAccountBalance, formatCurrency } = useERP();
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id || '');
  const [viewingTxn, setViewingTxn] = useState<Transaction | null>(null);

  const account = accounts.find(a => a.id === selectedAccount);
  
  // Filter transactions that involve this account
  const filteredTxns = transactions.filter(t => t.entries.some(e => e.accountId === selectedAccount));

  return (
    <Layout title="Account Ledgers">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-fit">
          <label className="block text-sm font-bold text-gray-700 mb-2">Select Account</label>
          <select 
            className="w-full p-2 border border-gray-300 rounded mb-4"
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
          >
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.category})</option>)}
          </select>

          <div className="p-4 bg-gray-50 rounded border border-gray-200 text-center">
            <p className="text-sm text-gray-500 mb-1">Current Balance</p>
            <p className="text-2xl font-bold text-slate-800">{formatCurrency(getAccountBalance(selectedAccount))}</p>
            <p className="text-xs text-gray-400 mt-2">{account?.type}</p>
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Description</th>
                <th className="p-4">Type</th>
                <th className="p-4 text-right">Debit</th>
                <th className="p-4 text-right">Credit</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTxns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No transactions found for this account.</td>
                </tr>
              ) : (
                filteredTxns.map(txn => {
                  const entry = txn.entries.find(e => e.accountId === selectedAccount);
                  if (!entry) return null;
                  return (
                    <tr key={txn.id} className="hover:bg-gray-50 transition group">
                      <td className="p-4 text-sm text-gray-600">{new Date(txn.date).toLocaleDateString()}</td>
                      <td className="p-4 text-sm font-medium text-gray-800">{txn.description}</td>
                      <td className="p-4 text-xs">
                        <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-600">{txn.type}</span>
                      </td>
                      <td className="p-4 text-sm text-right text-gray-600">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
                      <td className="p-4 text-sm text-right text-gray-600">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => setViewingTxn(txn)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition opacity-0 group-hover:opacity-100"
                        >
                          <Info size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {viewingTxn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-900 text-white">
              <div>
                <h3 className="text-xl font-bold">Journal Entry Details</h3>
                <p className="text-xs text-slate-400 mt-1">ID: {viewingTxn.id}</p>
              </div>
              <button onClick={() => setViewingTxn(null)} className="p-2 hover:bg-slate-800 rounded-full transition">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Description</p>
                  <p className="font-medium text-slate-800">{viewingTxn.description}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Date</p>
                  <p className="font-medium text-slate-800">{new Date(viewingTxn.date).toLocaleString()}</p>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="p-3 font-bold text-slate-600">Account</th>
                      <th className="p-3 font-bold text-slate-600 text-right">Debit</th>
                      <th className="p-3 font-bold text-slate-600 text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {viewingTxn.entries.map((entry, i) => {
                      const acc = accounts.find(a => a.id === entry.accountId);
                      return (
                        <tr key={i}>
                          <td className="p-3">
                            <p className="font-medium text-slate-800">{acc?.name}</p>
                            <p className="text-[10px] text-gray-400 uppercase">{acc?.type} • {acc?.id}</p>
                          </td>
                          <td className="p-3 text-right font-mono text-slate-600">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
                          <td className="p-3 text-right font-mono text-slate-600">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t-2">
                    <tr>
                      <td className="p-3">Total</td>
                      <td className="p-3 text-right font-mono">{formatCurrency(viewingTxn.entries.reduce((s, e) => s + e.debit, 0))}</td>
                      <td className="p-3 text-right font-mono">{formatCurrency(viewingTxn.entries.reduce((s, e) => s + e.credit, 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t flex justify-end">
              <button 
                onClick={() => setViewingTxn(null)}
                className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
