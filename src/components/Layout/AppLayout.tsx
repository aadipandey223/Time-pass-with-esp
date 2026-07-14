import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Outlet } from 'react-router-dom';

export const AppLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-50 dark:bg-[#09090b] relative transition-colors duration-300">
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <Sidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
      
      <main className="flex-1 flex flex-col relative z-10 overflow-y-auto custom-scrollbar">
        <Topbar onMenuClick={() => setIsMobileMenuOpen(true)} />
        <div className="p-6 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
