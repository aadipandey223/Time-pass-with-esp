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
        "glass-panel rounded-none border-y-0 border-l-0 flex flex-col h-full z-50 fixed md:sticky top-0 transition-transform duration-300 ease-in-out md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex items-center justify-between p-6">
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
            <div className="w-8 h-8 rounded-full bg-neon-cyan/20 flex items-center justify-center border border-neon-cyan/50 flex-shrink-0">
              <Cpu className="w-4 h-4 text-neon-cyan" />
            </div>
            <span className="font-bold tracking-widest text-glow-cyan text-neon-cyan uppercase text-sm">Hub OS</span>
          </motion.div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0 hidden md:block"
          >
            {collapsed ? <ChevronRight className="w-5 h-5 text-white/70" /> : <ChevronLeft className="w-5 h-5 text-white/70" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0 md:hidden"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto hide-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => {
              if (window.innerWidth < 768) setIsOpen(false);
            }}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300',
                isActive
                  ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-medium whitespace-nowrap">
                {item.label}
              </motion.span>
            )}
          </NavLink>
        ))}
      </div>
    </motion.aside>
  );
};
