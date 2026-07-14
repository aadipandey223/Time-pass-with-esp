import React, { useState, useEffect } from 'react';
import { GlassPanel } from '../Layout/GlassPanel';
import { Cpu, Zap, Wifi, ThermometerSun } from 'lucide-react';

export const HardwareMonitor: React.FC = () => {
  const [stats, setStats] = useState({
    cpu: 45,
    ram: 68,
    wifi: -55,
    temp: 42
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        cpu: prev.cpu + (Math.random() * 10 - 5),
        ram: prev.ram + (Math.random() * 4 - 2),
        wifi: prev.wifi + (Math.random() * 2 - 1),
        temp: prev.temp + (Math.random() * 2 - 1)
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <GlassPanel className="flex flex-col min-h-[320px]">
      <div className="flex justify-between items-center mb-6 z-10">
        <h3 className="font-semibold text-white/80 uppercase tracking-widest text-sm text-glow">Hardware Telemetry</h3>
        <Cpu className="w-4 h-4 text-neon-magenta animate-pulse" />
      </div>

      <div className="space-y-6 flex-1 z-10">
        <StatBar label="CPU Load" value={Math.max(0, Math.min(100, stats.cpu))} unit="%" color="bg-neon-magenta" icon={Cpu} />
        <StatBar label="RAM Usage" value={Math.max(0, Math.min(100, stats.ram))} unit="%" color="bg-neon-blue" icon={Zap} />
        <StatBar label="Temperature" value={Math.max(20, Math.min(80, stats.temp))} unit="°C" color="bg-neon-warning" icon={ThermometerSun} />
        <StatBar label="WiFi RSSI" value={Math.max(-100, Math.min(0, stats.wifi))} unit="dBm" color="bg-neon-cyan" icon={Wifi} isNegative />
      </div>
    </GlassPanel>
  );
};

const StatBar = ({ label, value, unit, color, icon: Icon, isNegative = false }: any) => {
  const displayValue = value.toFixed(1);
  const percentage = isNegative ? (100 + value) : value; // Simple normalization for dBm demo
  
  return (
    <div>
      <div className="flex justify-between text-xs uppercase tracking-wider mb-2">
        <span className="flex items-center gap-2 text-white/70">
          <Icon className="w-3 h-3" />
          {label}
        </span>
        <span className="font-mono text-white/90">{displayValue} {unit}</span>
      </div>
      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} shadow-[0_0_10px_currentColor] transition-all duration-1000 ease-out rounded-full`} 
          style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }} 
        />
      </div>
    </div>
  );
};
