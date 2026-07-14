import React, { useState, useEffect } from 'react';
import { Card } from '../Layout/Card';
import { Cpu, Zap, Wifi, ThermometerSun } from 'lucide-react';
import { useMQTT } from '@/context/MQTTContext';

export const HardwareMonitor: React.FC = () => {
  const { lastMessage, status } = useMQTT();
  const [stats, setStats] = useState({
    cpu: 0,
    ram: 0,
    wifi: -100,
    temp: 0
  });

  useEffect(() => {
    if (lastMessage && lastMessage.topic.includes('telemetry')) {
      try {
        const payload = JSON.parse(lastMessage.payload);
        setStats(prev => ({
          ...prev,
          ...payload
        }));
      } catch (e) {
        console.error('Failed to parse telemetry', e);
      }
    }
  }, [lastMessage]);

  return (
    <Card className="flex flex-col min-h-[320px] relative">
      <div className="flex justify-between items-center mb-6 z-10">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 uppercase tracking-tight text-sm">Hardware Telemetry</h3>
        <Cpu className={`w-4 h-4 text-zinc-500 ${status === 'connected' ? 'animate-pulse text-zinc-900 dark:text-zinc-50' : 'opacity-50'}`} />
      </div>

      <div className="space-y-6 flex-1 z-10">
        <StatBar label="CPU Load" value={Math.max(0, Math.min(100, stats.cpu))} unit="%" color="bg-zinc-900 dark:bg-zinc-100" icon={Cpu} />
        <StatBar label="RAM Usage" value={Math.max(0, Math.min(100, stats.ram))} unit="%" color="bg-zinc-700 dark:bg-zinc-300" icon={Zap} />
        <StatBar label="Temperature" value={Math.max(20, Math.min(80, stats.temp))} unit="°C" color="bg-orange-500" icon={ThermometerSun} />
        <StatBar label="WiFi RSSI" value={Math.max(-100, Math.min(0, stats.wifi))} unit="dBm" color="bg-blue-500" icon={Wifi} isNegative />
      </div>
      
      {status !== 'connected' && (
        <div className="absolute inset-0 bg-white/80 dark:bg-[#09090b]/80 rounded-xl z-20 flex items-center justify-center backdrop-blur-sm">
          <span className="text-zinc-500 text-xs tracking-widest uppercase font-medium">MQTT Disconnected</span>
        </div>
      )}
    </Card>
  );
};

const StatBar = ({ label, value, unit, color, icon: Icon, isNegative = false }: any) => {
  const displayValue = value.toFixed(1);
  const percentage = isNegative ? (100 + value) : value;
  
  return (
    <div>
      <div className="flex justify-between text-[11px] uppercase tracking-wider mb-2 font-medium">
        <span className="flex items-center gap-2 text-zinc-500">
          <Icon className="w-3.5 h-3.5" />
          {label}
        </span>
        <span className="font-mono text-zinc-900 dark:text-zinc-50">{displayValue} {unit}</span>
      </div>
      <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-1000 ease-out rounded-full`} 
          style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }} 
        />
      </div>
    </div>
  );
};
