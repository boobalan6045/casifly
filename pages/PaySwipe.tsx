import React, { useState, useEffect } from 'react';
import { useERP } from '../context/ERPContext';
import { Layout } from '../components/Layout';
import { LedgerEntry, TransactionType, Rates } from '../types';
import { Card, CardContent, Input, Select, Button } from '../components/ui/Elements';
import { safeParseFloat, roundCurrency } from '../lib/utils';
import { ArrowRight, CheckCircle2, Search } from 'lucide-react';
import { DEFAULT_COMMISSION_RATES } from '../constants';

export const PaySwipe: React.FC = () => {
  const { customers, wallets, accounts, postTransaction, formatCurrency, addCustomer, updateCustomer } = useERP();
  const [step, setStep] = useState<1|2>(1);
  
  // --- Step 1 State: Customer & Advance ---
  const [phone, setPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [commissionRates, setCommissionRates] = useState<Rates>(DEFAULT_COMMISSION_RATES);

  const [payAmount, setPayAmount] = useState<string>('');
  const [paySourceId, setPaySourceId] = useState('A002');
  
  // --- Step 2 State: Recovery ---
  const [swipeWalletId, setSwipeWalletId] = useState(wallets[0]?.id || '');
  const [pgName, setPgName] = useState('');
  const [cardType, setCardType] = useState('visa');
  
  const [collectionAmount, setCollectionAmount] = useState<string>('');
  const [collectAccount, setCollectAccount] = useState('A001');
  const [appliedMdrPercent, setAppliedMdrPercent] = useState<string>('0');
  
  // Editable Commission Rate for this transaction
  const [currentCommRate, setCurrentCommRate] = useState<string>('0');

  // Customer Lookup
  const handlePhoneBlur = () => {
    if (!phone) return;
    const found = customers.find(c => c.phone === phone);
    if (found) {
      setCustomerId(found.id);
      setCustomerName(found.name);
      setCommissionRates(found.commissionRates);
      setIsNewCustomer(false);
    } else {
      setCustomerId(null);
      setCustomerName('');
      setCommissionRates(DEFAULT_COMMISSION_RATES);
      setIsNewCustomer(true);
    }
  };

  const selectedWallet = wallets.find(w => w.id === swipeWalletId);
  const selectedPG = selectedWallet?.pgs.find(p => p.name === pgName) || selectedWallet?.pgs[0];

  // Auto-set initial PG
  useEffect(() => {
    if (selectedWallet && selectedWallet.pgs.length > 0) {
      setPgName(selectedWallet.pgs[0].name);
    }
  }, [swipeWalletId, selectedWallet]);

  // Sync Commission Rate input when Card Type changes
  useEffect(() => {
    // @ts-ignore
    const rate = commissionRates[cardType] || 0;
    setCurrentCommRate(rate.toString());
  }, [cardType, commissionRates]);

  // Calculations for Suggestions
  useEffect(() => {
    if (selectedWallet && selectedPG && cardType) {
      // @ts-ignore
      const mdr = selectedPG.charges[cardType] || 0;
      setAppliedMdrPercent(mdr.toString());
    }
    
    // Auto-calculate suggested collection amount based on Advance Amount * Edited Commission Rate
    if (payAmount) {
       const amt = safeParseFloat(payAmount);
       const rate = safeParseFloat(currentCommRate);
       const suggestedCollection = roundCurrency(amt * (rate / 100));
       setCollectionAmount(suggestedCollection.toString());
    }
  }, [swipeWalletId, pgName, cardType, payAmount, selectedWallet, selectedPG, currentCommRate]);

  const amount = safeParseFloat(payAmount);
  const collAmount = safeParseFloat(collectionAmount);
  const mdrPercent = safeParseFloat(appliedMdrPercent);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;
    if (!customerId && !customerName) return;

    let finalId = customerId;
    if (isNewCustomer) {
      // Create customer now so we have an ID for the advance
      finalId = addCustomer({
        name: customerName,
        phone,
        commissionRates: commissionRates
      });
      setCustomerId(finalId);
      setIsNewCustomer(false);
    }

    const entries: LedgerEntry[] = [
      { accountId: 'A006', debit: amount, credit: 0 },
      { accountId: paySourceId, debit: 0, credit: amount }
    ];
    postTransaction(
      `Advance Pay: ${customerName}`, 
      TransactionType.PAY_SWIPE, 
      entries,
      { customerId: finalId || undefined }
    );
    setStep(2);
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    const wallet = wallets.find(w => w.id === swipeWalletId);
    if (!wallet) return;

    // 1. Update Customer Rate if changed
    const rateVal = safeParseFloat(currentCommRate);
    if (customerId) {
        const updatedRates = { ...commissionRates, [cardType]: rateVal };
        updateCustomer(customerId, { commissionRates: updatedRates });
    }

    // 2. Financial Calculation
    const mdr = roundCurrency(amount * (mdrPercent / 100));

    const entries: LedgerEntry[] = [
      // 1. Principal Recovery (Wallet UP, Customer Debt DOWN)
      { accountId: wallet.ledgerAccountId, debit: amount, credit: 0 },
      { accountId: 'A006', debit: 0, credit: amount },
      
      // 2. Charges Collection (Bank UP, Income UP)
      { accountId: collectAccount, debit: collAmount, credit: 0 },
      { accountId: 'I001', debit: 0, credit: collAmount },
      
      // 3. MDR Expense (Expense UP, Wallet DOWN)
      { accountId: 'E001', debit: mdr, credit: 0 },
      { accountId: wallet.ledgerAccountId, debit: 0, credit: mdr }
    ];

    postTransaction(
      `Recovery: ${customerName} (${cardType.toUpperCase()})`, 
      TransactionType.PAY_SWIPE, 
      entries,
      { 
        customerId: customerId || undefined,
        walletId: wallet.id,
        cardType: cardType
      }
    );
    alert("Cycle Completed!");
    setStep(1);
    setPayAmount('');
    setCollectionAmount('');
    setPhone('');
    setCustomerName('');
    setCustomerId(null);
  };

  return (
    <Layout title="Pay & Swipe (Advance Flow)">
      <div className="max-w-3xl mx-auto">
        <div className="flex mb-8">
           <StepIndicator num={1} title="Pay Advance" active={step === 1} done={step > 1} />
           <div className="w-12 h-0.5 bg-gray-300 mt-5 mx-2"></div>
           <StepIndicator num={2} title="Swipe Recovery" active={step === 2} done={false} />
        </div>

        <Card>
          <CardContent>
            {step === 1 ? (
              <form onSubmit={handleStep1} className="space-y-6">
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

                <Input label="Advance Amount" type="number" className="font-bold text-lg" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
                <Select label="Pay From" value={paySourceId} onChange={e => setPaySourceId(e.target.value)} options={accounts.filter(a => ['Bank', 'Cash'].includes(a.category)).map(a => ({ label: `${a.name} (${formatCurrency(a.balance)})`, value: a.id }))} />
                <Button type="submit" className="w-full">Pay Bill (Record Advance) <ArrowRight size={16}/></Button>
              </form>
            ) : (
              <form onSubmit={handleStep2} className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-100">
                  <p className="text-sm text-blue-800">Recovering: <span className="font-bold">{formatCurrency(amount)}</span> from {customerName}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select label="Swipe Into Wallet" value={swipeWalletId} onChange={e => setSwipeWalletId(e.target.value)} options={wallets.map(w => ({ label: w.name, value: w.id }))} />
                  <Select 
                    label="Payment Gateway" 
                    value={pgName} 
                    onChange={e => setPgName(e.target.value)} 
                    options={selectedWallet?.pgs.map(p => ({ label: p.name, value: p.name })) || []} 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select 
                    label="Card Used"
                    value={cardType}
                    onChange={(e) => setCardType(e.target.value)}
                    options={[
                      { label: 'Visa', value: 'visa' },
                      { label: 'Mastercard', value: 'master' },
                      { label: 'Amex', value: 'amex' },
                      { label: 'Rupay', value: 'rupay' },
                    ]}
                  />
                  <Input 
                    label="Rate (%)" 
                    type="number" 
                    step="0.1" 
                    value={currentCommRate} 
                    onChange={e => setCurrentCommRate(e.target.value)} 
                  />
                  <Input 
                    label="Applied MDR %" 
                    type="number" 
                    step="0.1" 
                    value={appliedMdrPercent} 
                    onChange={e => setAppliedMdrPercent(e.target.value)} 
                    disabled
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input label="Charges Collected" type="number" value={collectionAmount} onChange={e => setCollectionAmount(e.target.value)} />
                    <p className="text-xs text-gray-400 mt-1">Calculated via {currentCommRate}%</p>
                  </div>
                  <Select label="Collected Into" value={collectAccount} onChange={e => setCollectAccount(e.target.value)} options={accounts.filter(a => ['Bank', 'Cash'].includes(a.category)).map(a => ({ label: a.name, value: a.id }))} />
                </div>
                
                <div className="text-right text-xs text-gray-500">
                   Est. MDR Cost: {formatCurrency(amount * (safeParseFloat(appliedMdrPercent)/100))}
                </div>

                <Button type="submit" variant="success" className="w-full bg-green-600 hover:bg-green-700 text-white">Complete Recovery</Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

const StepIndicator = ({ num, title, active, done }: any) => (
  <div className={`flex items-center gap-2 ${active ? 'text-blue-600' : 'text-gray-400'}`}>
    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${active ? 'bg-blue-600 text-white' : done ? 'bg-green-500 text-white' : 'bg-gray-100'}`}>
      {done ? <CheckCircle2 size={20} /> : num}
    </div>
    <span className="font-medium">{title}</span>
  </div>
);
