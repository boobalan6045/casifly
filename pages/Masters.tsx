import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { Layout } from '../components/Layout';
import { Card, CardHeader, CardContent, Input, Button, Select } from '../components/ui/Elements';
import { Plus, Save, Activity, Users, Wallet as WalletIcon, Edit2, Check, X } from 'lucide-react';
import { CreateCustomerDTO, CreateWalletDTO, PGConfig } from '../types';
import { formatCurrency, safeParseFloat } from '../lib/utils';

type Tab = 'reconcile' | 'customers' | 'wallets';

export const Masters: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('reconcile');

  return (
    <Layout title="Masters & Configuration">
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <TabButton id="reconcile" active={activeTab} onClick={setActiveTab} icon={Activity} label="Reconciliation" />
        <TabButton id="customers" active={activeTab} onClick={setActiveTab} icon={Users} label="Customers" />
        <TabButton id="wallets" active={activeTab} onClick={setActiveTab} icon={WalletIcon} label="Wallets" />
      </div>

      <div className="animate-fade-in">
        {activeTab === 'reconcile' && <ReconciliationView />}
        {activeTab === 'customers' && <CustomersView />}
        {activeTab === 'wallets' && <WalletsView />}
      </div>
    </Layout>
  );
};

const TabButton = ({ id, active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={() => onClick(id)}
    className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-all rounded-t-lg ${
      active === id 
        ? 'bg-white border-x border-t border-gray-200 text-blue-600 -mb-px' 
        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
    }`}
  >
    <Icon size={16} />
    {label}
  </button>
);

const ReconciliationView = () => {
  const { wallets, getAccountBalance, formatCurrency, reconcileWallet } = useERP();
  const [values, setValues] = useState<Record<string, string>>({});

  const handleAction = (id: string) => {
    const val = parseFloat(values[id]);
    if (!isNaN(val)) {
      reconcileWallet(id, val);
      setValues(p => ({...p, [id]: ''}));
      alert('Reconciliation posted.');
    }
  };

  return (
    <Card>
      <CardHeader title="Daily Wallet Reconciliation" subtitle="Compare system balance with actual closing balance" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-semibold border-b">
            <tr>
              <th className="p-4">Wallet</th>
              <th className="p-4 text-right">System Balance</th>
              <th className="p-4 w-48">Actual Balance</th>
              <th className="p-4 w-32">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {wallets.map(w => (
              <tr key={w.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium text-slate-700">{w.name}</td>
                <td className="p-4 text-right font-mono text-blue-600">{formatCurrency(getAccountBalance(w.ledgerAccountId))}</td>
                <td className="p-4">
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={values[w.id] || ''} 
                    onChange={e => setValues({...values, [w.id]: e.target.value})} 
                  />
                </td>
                <td className="p-4">
                  <Button size="sm" onClick={() => handleAction(w.id)}>Reconcile</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const CustomersView = () => {
  const { customers, addCustomer } = useERP();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<CreateCustomerDTO>({ 
    name: '', 
    phone: '', 
    commissionRates: { visa: 2.0, master: 2.0, amex: 3.0, rupay: 1.5 } 
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(formData.name) {
      addCustomer(formData);
      setIsAdding(false);
      setFormData({ name: '', phone: '', commissionRates: { visa: 2.0, master: 2.0, amex: 3.0, rupay: 1.5 } });
    }
  };

  const updateRate = (key: keyof typeof formData.commissionRates, value: string) => {
    setFormData(prev => ({
      ...prev,
      commissionRates: {
        ...prev.commissionRates,
        [key]: safeParseFloat(value)
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? 'secondary' : 'primary'}>
          {isAdding ? 'Cancel' : 'Add New Customer'}
        </Button>
      </div>

      {isAdding && (
        <Card className="max-w-xl mx-auto border-blue-200 shadow-md">
          <CardHeader title="Create Customer" subtitle="Adds a customer and a corresponding payable ledger account." />
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              <Input label="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-bold text-gray-700 mb-3">Commission / Service Charges (%)</p>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Visa" type="number" step="0.1" value={formData.commissionRates.visa} onChange={e => updateRate('visa', e.target.value)} />
                  <Input label="Master" type="number" step="0.1" value={formData.commissionRates.master} onChange={e => updateRate('master', e.target.value)} />
                  <Input label="Amex" type="number" step="0.1" value={formData.commissionRates.amex} onChange={e => updateRate('amex', e.target.value)} />
                  <Input label="Rupay" type="number" step="0.1" value={formData.commissionRates.rupay} onChange={e => updateRate('rupay', e.target.value)} />
                </div>
              </div>

              <Button type="submit" className="w-full">Create Customer</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map(c => (
          <Card key={c.id}>
            <div className="p-4 flex items-start justify-between">
              <div>
                <h4 className="font-bold text-slate-800">{c.name}</h4>
                <p className="text-sm text-gray-500">{c.phone}</p>
              </div>
            </div>
            <div className="px-4 py-2 bg-gray-50 border-y border-gray-100 grid grid-cols-4 gap-2 text-center text-xs">
              <div><div className="text-gray-400">Visa</div><div className="font-bold">{c.commissionRates.visa}%</div></div>
              <div><div className="text-gray-400">Master</div><div className="font-bold">{c.commissionRates.master}%</div></div>
              <div><div className="text-gray-400">Amex</div><div className="font-bold">{c.commissionRates.amex}%</div></div>
              <div><div className="text-gray-400">Rupay</div><div className="font-bold">{c.commissionRates.rupay}%</div></div>
            </div>
            <div className="px-4 py-2 text-xs text-gray-400">ID: {c.id}</div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const WalletsView = () => {
  const { wallets, addWallet, addWalletPG, updateWalletPG } = useERP();
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  const [editingPG, setEditingPG] = useState<{ walletId: string, pgName: string | null } | null>(null);
  
  // Form State for new Wallet
  const [walletForm, setWalletForm] = useState({ 
    name: '', 
    pgName: 'Default PG', 
    visa: '1.2', master: '1.2', amex: '2.5', rupay: '0.5'
  });

  // Form State for new/edit PG
  const [pgForm, setPgForm] = useState({
    name: '', 
    visa: '', master: '', amex: '', rupay: ''
  });

  const openPGForm = (walletId: string, pg?: PGConfig) => {
    setEditingPG({ walletId, pgName: pg ? pg.name : null });
    if (pg) {
      setPgForm({
        name: pg.name,
        visa: pg.charges.visa.toString(),
        master: pg.charges.master.toString(),
        amex: pg.charges.amex.toString(),
        rupay: pg.charges.rupay.toString(),
      });
    } else {
      setPgForm({ name: '', visa: '', master: '', amex: '', rupay: '' });
    }
  };

  const handleWalletSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(walletForm.name) {
      addWallet({
        name: walletForm.name,
        pgName: walletForm.pgName,
        charges: {
          visa: safeParseFloat(walletForm.visa),
          master: safeParseFloat(walletForm.master),
          amex: safeParseFloat(walletForm.amex),
          rupay: safeParseFloat(walletForm.rupay),
        }
      });
      setIsAddingWallet(false);
    }
  };

  const handlePGSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPG || !pgForm.name) return;
    
    const config: PGConfig = {
      name: pgForm.name,
      charges: {
        visa: safeParseFloat(pgForm.visa),
        master: safeParseFloat(pgForm.master),
        amex: safeParseFloat(pgForm.amex),
        rupay: safeParseFloat(pgForm.rupay),
      }
    };

    if (editingPG.pgName) {
      // Edit existing
      updateWalletPG(editingPG.walletId, editingPG.pgName, config);
    } else {
      // Add new
      addWalletPG(editingPG.walletId, config);
    }
    setEditingPG(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setIsAddingWallet(!isAddingWallet)} variant={isAddingWallet ? 'secondary' : 'primary'}>
          {isAddingWallet ? 'Cancel' : 'Add New Wallet'}
        </Button>
      </div>

      {isAddingWallet && (
        <Card className="max-w-2xl mx-auto border-purple-200 shadow-md">
          <CardHeader title="Add Wallet Configuration" subtitle="Creates wallet asset account and initial PG." />
          <CardContent>
            <form onSubmit={handleWalletSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Wallet Name" value={walletForm.name} onChange={e => setWalletForm({...walletForm, name: e.target.value})} required />
                <Input label="PG Provider Name" value={walletForm.pgName} onChange={e => setWalletForm({...walletForm, pgName: e.target.value})} required />
              </div>
              <p className="text-sm font-bold text-gray-600 mt-4 border-b pb-1">MDR Charges (%)</p>
              <div className="grid grid-cols-4 gap-4">
                <Input label="Visa" type="number" step="0.1" value={walletForm.visa} onChange={e => setWalletForm({...walletForm, visa: e.target.value})} />
                <Input label="Master" type="number" step="0.1" value={walletForm.master} onChange={e => setWalletForm({...walletForm, master: e.target.value})} />
                <Input label="Amex" type="number" step="0.1" value={walletForm.amex} onChange={e => setWalletForm({...walletForm, amex: e.target.value})} />
                <Input label="Rupay" type="number" step="0.1" value={walletForm.rupay} onChange={e => setWalletForm({...walletForm, rupay: e.target.value})} />
              </div>
              <Button type="submit" className="w-full mt-4">Create Wallet</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* PG Edit Modal/Overlay could be here, but using inline for now or just replacing list item */}
      {editingPG && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader 
              title={editingPG.pgName ? `Edit PG: ${editingPG.pgName}` : "Add New PG"} 
              action={<Button variant="outline" size="sm" onClick={() => setEditingPG(null)}><X size={16}/></Button>} 
            />
            <CardContent>
               <form onSubmit={handlePGSubmit} className="space-y-4">
                 <Input label="PG Name" value={pgForm.name} onChange={e => setPgForm({...pgForm, name: e.target.value})} disabled={!!editingPG.pgName} />
                 <div className="grid grid-cols-2 gap-4">
                    <Input label="Visa %" type="number" step="0.1" value={pgForm.visa} onChange={e => setPgForm({...pgForm, visa: e.target.value})} />
                    <Input label="Master %" type="number" step="0.1" value={pgForm.master} onChange={e => setPgForm({...pgForm, master: e.target.value})} />
                    <Input label="Amex %" type="number" step="0.1" value={pgForm.amex} onChange={e => setPgForm({...pgForm, amex: e.target.value})} />
                    <Input label="Rupay %" type="number" step="0.1" value={pgForm.rupay} onChange={e => setPgForm({...pgForm, rupay: e.target.value})} />
                 </div>
                 <Button type="submit" className="w-full">Save Configuration</Button>
               </form>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {wallets.map(w => (
          <Card key={w.id} className="h-full">
            <CardHeader 
              title={w.name} 
              subtitle={`Ledger: ${w.ledgerAccountId}`} 
              action={<Button size="sm" variant="outline" onClick={() => openPGForm(w.id)}><Plus size={14}/> Add PG</Button>}
            />
            <CardContent className="space-y-4">
              {w.pgs.map(pg => (
                <div key={pg.name} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                     <p className="font-bold text-slate-700">{pg.name}</p>
                     <button onClick={() => openPGForm(w.id, pg)} className="text-blue-600 hover:text-blue-800"><Edit2 size={14}/></button>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-white p-1 rounded border"><div className="text-gray-400">Visa</div>{pg.charges.visa}%</div>
                    <div className="bg-white p-1 rounded border"><div className="text-gray-400">Master</div>{pg.charges.master}%</div>
                    <div className="bg-white p-1 rounded border"><div className="text-gray-400">Amex</div>{pg.charges.amex}%</div>
                    <div className="bg-white p-1 rounded border"><div className="text-gray-400">Rupay</div>{pg.charges.rupay}%</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
