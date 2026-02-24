import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { SwipePay } from './pages/SwipePay';
import { PaySwipe } from './pages/PaySwipe';
import { MoneyTransfer } from './pages/MoneyTransfer';
import { Ledgers } from './pages/Ledgers';
import { Reports } from './pages/Reports';
import { Masters } from './pages/Masters';
import { CRM } from './pages/CRM';
import { ERPProvider } from './context/ERPContext';

const App: React.FC = () => {
  const [currentView, setView] = useState('dashboard');

  const renderView = () => {
    switch(currentView) {
      case 'dashboard': return <Dashboard />;
      case 'swipe-pay': return <SwipePay />;
      case 'pay-swipe': return <PaySwipe />;
      case 'money-transfer': return <MoneyTransfer />;
      case 'crm': return <CRM />;
      case 'ledgers': return <Ledgers />;
      case 'reports': return <Reports />;
      case 'masters': return <Masters />;
      default: return <Dashboard />;
    }
  };

  return (
    <ERPProvider>
      <div className="flex bg-slate-50 min-h-screen font-sans">
        <Sidebar currentView={currentView} setView={setView} />
        <main className="flex-1 ml-64 p-2 overflow-x-hidden">
          {renderView()}
        </main>
      </div>
    </ERPProvider>
  );
};

export default App;
