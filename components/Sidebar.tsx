import React from 'react';
import { 
  LayoutDashboard, 
  CreditCard, 
  ArrowLeftRight, 
  Banknote, 
  BookOpen, 
  PieChart, 
  Settings,
  Users
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'swipe-pay', label: 'Swipe & Pay', icon: CreditCard },
    { id: 'pay-swipe', label: 'Pay & Swipe', icon: ArrowLeftRight },
    { id: 'money-transfer', label: 'Money Transfer', icon: Banknote },
    { id: 'crm', label: 'CRM & Customers', icon: Users },
    { id: 'ledgers', label: 'Ledgers', icon: BookOpen },
    { id: 'reports', label: 'Reports & P&L', icon: PieChart },
    { id: 'masters', label: 'Masters', icon: Settings },
  ];

  return (
    <div className="w-64 bg-primary text-gray-300 h-screen flex flex-col shadow-xl fixed left-0 top-0">
      <div className="h-16 flex items-center px-6 border-b border-gray-700 bg-gray-900">
        <div className="text-xl font-bold text-white tracking-wider flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center font-bold text-white">F</div>
          FINLEDGER
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setView(item.id)}
                  className={`w-full flex items-center gap-3 px-6 py-3 transition-all duration-200 ${
                    isActive 
                      ? 'bg-accent/10 text-accent border-r-4 border-accent' 
                      : 'hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-800 text-xs text-gray-500">
        <p>System Status: Online</p>
        <p>v1.2.0 - CRM & Analytics</p>
      </div>
    </div>
  );
};
