import React from 'react';
import { useClock } from '@/hooks/useClock';
import { useMQTT } from '@/context/MQTTContext';
import { Bell, Search, Wifi, WifiOff, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopbarProps {
  onMenuClick: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const { time, date } = useClock();
  const { status } = useMQTT();

  return (
    <header className="glass-panel mx-4 md:mx-6 mt-4 md:mt-6 mb-6 px-4 md:px-6 py-4 flex items-center justify-between z-40 sticky top-4 md:top-6">
      <div className="flex items-center gap-4 md:gap-6">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 hover:bg-white/10 rounded-xl transition-colors"
        >
          <Menu className="w-6 h-6 text-white/80" />
        </button>
        <div className="flex flex-col">
          <span className="text-xl md:text-2xl font-light tracking-wider font-mono">{time}</span>
          <span className="text-[10px] md:text-xs text-white/50 uppercase tracking-widest">{date}</span>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-8 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search commands... (Ctrl+K)"
            className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 transition-all placeholder:text-white/30"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <div className="flex items-center gap-2">
          {status === 'connected' ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2 text-neon-success">
              <Wifi className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider hidden sm:block">Online</span>
            </motion.div>
          ) : status === 'reconnecting' ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2 text-neon-warning">
              <Wifi className="w-4 h-4 animate-pulse" />
              <span className="text-xs font-medium uppercase tracking-wider hidden sm:block">Reconnecting</span>
            </motion.div>
          ) : (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2 text-neon-danger">
              <WifiOff className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider hidden sm:block">Offline</span>
            </motion.div>
          )}
        </div>

        <button className="relative p-2 hover:bg-white/10 rounded-full transition-colors hidden sm:block">
          <Bell className="w-5 h-5 text-white/70" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-neon-magenta rounded-full shadow-[0_0_8px_rgba(255,0,136,0.8)]" />
        </button>

        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-neon-purple to-neon-blue p-[2px]">
          <div className="w-full h-full bg-background rounded-full overflow-hidden border border-background">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="User" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </header>
  );
};
