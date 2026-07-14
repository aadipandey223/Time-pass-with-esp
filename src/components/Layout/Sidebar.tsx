import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Settings, Cpu, Activity, BrainCircuit, Thermometer, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Thermometer, label: 'Weather', path: '/weather' },
    { icon: BrainCircuit, label: 'AI Core', path: '/ai' },
    { icon: Cpu, label: 'Hardware', path: '/hardware' },
    { icon: Activity, label: 'Analytics', path: '/analytics' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      className={cn(
        "bg-white dark:bg-[#09090b] border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full z-50 fixed md:sticky top-0 transition-transform duration-300 ease-in-out md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex items-center justify-between p-6 h-[80px]">
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="w-8 h-8 rounded-md bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-4 h-4 text-white dark:text-zinc-900" />
            </div>
            <span className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 text-base">Hub OS</span>
          </motion.div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors flex-shrink-0 hidden md:block text-zinc-500"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors flex-shrink-0 md:hidden text-zinc-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 space-y-1 mt-2 overflow-y-auto hide-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => {
              if (window.innerWidth < 768) setIsOpen(false);
            }}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium',
                isActive
                  ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="whitespace-nowrap">
                {item.label}
              </motion.span>
            )}
          </NavLink>
        ))}
      </div>
    </motion.aside>
  );
};
