import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { Layout } from '../components/Layout';
import { LedgerEntry, TransactionType } from '../types';
import { Card, CardContent, CardHeader, Input, Select, Button } from '../components/ui/Elements';
import { safeParseFloat } from '../lib/utils';
import { ArrowDown, Search } from 'lucide-react';
import { DEFAULT_COMMISSION_RATES } from '../constants';

export const MoneyTransfer: React.FC = () => {
  const { customers, wallets, accounts, postTransaction, formatCurrency, addCustomer } = useERP();

  const [phone, setPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  const [amount, setAmount] = useState('');
  const [inflowAccount, setInflowAccount] = useState('A001');
  const [outflowWallet, setOutflowWallet] = useState(wallets[0]?.id || '');
  const [serviceCharge, setServiceCharge] = useState('');

  const handlePhoneBlur = () => {
    if (!phone) return;
    const found = customers.find(c => c.phone === phone);
    if (found) {
      setCustomerId(found.id);
      setCustomerName(found.name);
      setIsNewCustomer(false);
    } else {
      setCustomerId(null);
      setCustomerName('');
      setIsNewCustomer(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = safeParseFloat(amount);
    const charge = safeParseFloat(serviceCharge);
    const wallet = wallets.find(w => w.id === outflowWallet);
    
    if (val <= 0 || !wallet || (!customerId && !customerName)) return;

    let finalName = customerName;
    if (isNewCustomer) {
        // Simple create for DMT, using default rates in background
        // addCustomer requires rates, we can pass default
        addCustomer({
            name: customerName,
            phone,
            commissionRates: DEFAULT_COMMISSION_RATES
        });
    }

    const totalReceived = val + charge;
    const entries: LedgerEntry[] = [
      { accountId: inflowAccount, debit: totalReceived, credit: 0 },
      { accountId: wallet.ledgerAccountId, debit: 0, credit: val },
      { accountId: 'I001', debit: 0, credit: charge }
    ];
    
    postTransaction(
      `DMT: ${finalName}`, 
      TransactionType.MONEY_TRANSFER, 
      entries,
      { 
        customerId: customerId || undefined,
        walletId: wallet.id 
      }
    );
    alert("DMT Recorded Successfully");
    setAmount('');
    setServiceCharge('');
    setPhone('');
    setCustomerName('');
    setIsNewCustomer(false);
  };

  return (
    <Layout title="Money Transfer (DMT)">
       <Card className="max-w-2xl mx-auto">
          <CardHeader title="Domestic Money Transfer" subtitle="Receive cash, send from wallet." />
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Input 
                      label="Customer Phone" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      onBlur={handlePhoneBlur}
                      placeholder="Search..."
                      required
                    />
                    <div className="absolute right-3 top-9 text-gray-400 pointer-events-none"><Search size={16}/></div>
                  </div>
                  <Input 
                    label="Customer Name" 
                    value={customerName} 
                    onChange={(e) => setCustomerName(e.target.value)} 
                    disabled={!isNewCustomer && !!customerId}
                    required
                  />
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                 <h4 className="text-xs font-bold text-gray-500 uppercase">Incoming (Cash/Bank)</h4>
                 <div className="grid grid-cols-2 gap-4">
                    <Input label="Transfer Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
                    <Input label="Our Commission" type="number" value={serviceCharge} onChange={e => setServiceCharge(e.target.value)} />
                 </div>
                 <Select label="Receive Into" value={inflowAccount} onChange={e => setInflowAccount(e.target.value)} options={accounts.filter(a => ['Cash', 'Bank'].includes(a.category)).map(a => ({ label: a.name, value: a.id }))} />
              </div>

              <div className="flex justify-center text-gray-400"><ArrowDown /></div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-4">
                 <h4 className="text-xs font-bold text-blue-600 uppercase">Outgoing (Wallet)</h4>
                 <Select label="Send From Wallet" value={outflowWallet} onChange={e => setOutflowWallet(e.target.value)} options={wallets.map(w => ({ label: `${w.name} (Bal: ${formatCurrency(accounts.find(a => a.id === w.ledgerAccountId)?.balance || 0)})`, value: w.id }))} />
              </div>

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">Execute Transfer</Button>
            </form>
          </CardContent>
       </Card>
    </Layout>
  );
};
