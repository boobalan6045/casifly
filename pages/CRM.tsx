import React, { useState, useMemo } from 'react';
import { useERP } from '../context/ERPContext';
import { Layout } from '../components/Layout';
import { Card, CardHeader, CardContent, Input, Button } from '../components/ui/Elements';
import { Search, UserCheck, UserX, Clock, Send, Phone, AlertCircle } from 'lucide-react';

export const CRM: React.FC = () => {
  const { customers, transactions, formatCurrency } = useERP();
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [search, setSearch] = useState('');

  const customerMetrics = useMemo(() => {
    const now = new Date();
    return customers.map(c => {
      const cTxns = transactions.filter(t => t.metadata?.customerId === c.id);
      const totalVolume = cTxns.reduce((sum, t) => {
         const swipeCredit = t.entries.find(e => e.accountId === 'L001' && e.credit > 0);
         return sum + (swipeCredit?.credit || 0);
      }, 0);

      const sortedTxns = [...cTxns].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const lastActiveDate = sortedTxns.length > 0 ? new Date(sortedTxns[0].date) : null;
      const daysInactive = lastActiveDate 
        ? Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 3600 * 24))
        : 999; 

      return {
        ...c,
        totalVolume,
        txnCount: cTxns.length,
        lastActive: lastActiveDate,
        daysInactive,
        status: daysInactive > 90 ? 'inactive' : 'active'
      };
    });
  }, [customers, transactions]);

  const filteredCustomers = customerMetrics.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchesFilter = filter === 'all' || c.status === filter;
    return matchesSearch && matchesFilter;
  });

  const sendReminder = (name: string, phone: string) => {
    alert(`Reminder nudge triggered for ${name} (${phone}). (Simulated SMS/WhatsApp)`);
  };

  return (
    <Layout title="CRM & Activity Monitoring">
      
      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative w-full md:w-96">
           <Input 
             placeholder="Search by name or 10-digit phone..." 
             value={search} 
             onChange={e => setSearch(e.target.value)} 
             className="pl-10"
           />
           <Search className="absolute left-3 top-3.5 text-gray-400" size={16} />
        </div>
        
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
           <FilterBtn label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
           <FilterBtn label="Active" active={filter === 'active'} onClick={() => setFilter('active')} count={customerMetrics.filter(c => c.status === 'active').length} />
           <FilterBtn label="Inactive (90d+)" active={filter === 'inactive'} onClick={() => setFilter('inactive')} count={customerMetrics.filter(c => c.status === 'inactive').length} isDanger />
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-widest">
               <tr>
                 <th className="p-4">Customer Details</th>
                 <th className="p-4">Loyalty Status</th>
                 <th className="p-4">Last Active</th>
                 <th className="p-4 text-right">Lifetime Volume</th>
                 <th className="p-4 text-center">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
               {filteredCustomers.map(c => (
                 <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                   <td className="p-4">
                     <div className="font-bold text-slate-800">{c.name}</div>
                     <div className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10}/> {c.phone}</div>
                   </td>
                   <td className="p-4">
                     {c.status === 'active' ? (
                       <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                         <UserCheck size={12}/> ACTIVE
                       </span>
                     ) : (
                       <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                         <AlertCircle size={12}/> INACTIVE ({c.daysInactive}D)
                       </span>
                     )}
                   </td>
                   <td className="p-4">
                     {c.lastActive ? (
                       <div className="flex items-center gap-2 text-slate-600">
                         <Clock size={14} className="text-gray-400"/>
                         {c.lastActive.toLocaleDateString()}
                       </div>
                     ) : (
                       <span className="text-gray-400 italic">No Activity Recorded</span>
                     )}
                   </td>
                   <td className="p-4 text-right font-black text-slate-700">
                     {formatCurrency(c.totalVolume)}
                   </td>
                   <td className="p-4">
                     <div className="flex justify-center gap-2">
                       <Button size="sm" variant="outline" className="h-9 px-3" onClick={() => sendReminder(c.name, c.phone)}>
                         <Send size={14} /> Nudge
                       </Button>
                     </div>
                   </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Layout>
  );
};

const FilterBtn = ({ label, active, onClick, count, isDanger }: any) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
      active 
        ? isDanger ? 'bg-red-600 text-white shadow-lg' : 'bg-blue-600 text-white shadow-lg'
        : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    {label}
    {count !== undefined && <span className={`px-1.5 rounded ${active ? 'bg-white/20' : 'bg-gray-200 text-gray-600'}`}>{count}</span>}
  </button>
);
