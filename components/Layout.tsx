import React, { ReactNode } from 'react';

export const Layout: React.FC<{ children: ReactNode; title: string }> = ({ children, title }) => {
  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
      </header>
      {children}
    </div>
  );
};