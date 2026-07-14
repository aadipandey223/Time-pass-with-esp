import React, { useState, useEffect } from 'react';
import { useClock } from '@/hooks/useClock';
import { useMQTT } from '@/context/MQTTContext';
import { useTheme } from '@/context/ThemeContext';
import { Bell, Search, Wifi, WifiOff, Menu, Sun, Moon, BatteryFull, BatteryLow, BatteryMedium } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopbarProps {
  onMenuClick: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const { time, date } = useClock();
  const { status, publish, lastMessage } = useMQTT();
  const { theme, setTheme } = useTheme();
  
  const [battery, setBattery] = useState<number | null>(null);

  useEffect(() => {
    if (lastMessage && lastMessage.topic.includes('telemetry')) {
      try {
        const payload = JSON.parse(lastMessage.payload);
        if (payload.battery_percent !== undefined) {
          setBattery(payload.battery_percent);
        }
      } catch(e) {}
    }
  }, [lastMessage]);

  const renderBatteryIcon = () => {
    if (battery === null) return null;
    if (battery > 80) return <BatteryFull className="w-4 h-4 text-green-500" />;
    if (battery > 30) return <BatteryMedium className="w-4 h-4 text-zinc-500" />;
    return <BatteryLow className="w-4 h-4 text-red-500 animate-pulse" />;
  };

  return (
    <header className="bg-white dark:bg-[#09090b] border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between z-40 sticky top-0 transition-colors">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors text-zinc-500"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <span className="text-xl font-medium tracking-tight font-mono text-zinc-900 dark:text-zinc-50">{time}</span>
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{date}</span>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-8 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search commands..."
            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 rounded-md px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 hidden lg:flex">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest mr-2 font-medium">ESP Screen:</span>
          <select 
            onChange={(e) => {
              if (status === 'connected') {
                publish('myhome/smarthub_xyz/cmd', JSON.stringify({ action: 'set_mode', mode: e.target.value }));
              }
            }}
            className="bg-transparent text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
          >
            <option value="standby">Standby / Clock</option>
            <option value="weather">Weather</option>
            <option value="pomodoro">Pomodoro</option>
            <option value="ai_face">AI Core</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {status === 'connected' ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium tracking-wide hidden sm:block">ESP Online</span>
              </motion.div>
            ) : status === 'reconnecting' ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                <Wifi className="w-4 h-4 text-yellow-500 animate-pulse" />
                <span className="text-xs font-medium tracking-wide hidden sm:block">Reconnecting</span>
              </motion.div>
            ) : (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-xs font-medium tracking-wide hidden sm:block">Offline</span>
              </motion.div>
            )}
          </div>

          {battery !== null && status === 'connected' && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 border-l border-zinc-200 dark:border-zinc-800 pl-4 hidden sm:flex">
              {renderBatteryIcon()}
              <span className="text-xs font-medium font-mono">{battery}%</span>
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-2 border-l border-zinc-200 dark:border-zinc-800 pl-4 md:pl-6">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors text-zinc-500"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          
          <button className="relative p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors text-zinc-500 hidden sm:block">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-black dark:bg-white rounded-full" />
          </button>

          <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden border border-zinc-200 dark:border-zinc-700 ml-2">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="User" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </header>
  );
};
