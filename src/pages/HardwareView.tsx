import React, { useState, useEffect } from 'react';
import { Card } from '../components/Layout/Card';
import { Cpu, Zap, Wifi, ThermometerSun, Activity, Battery } from 'lucide-react';
import { useMQTT } from '@/context/MQTTContext';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface DataPoint {
  time: string;
  cpu: number;
  ram: number;
  temp: number;
  wifi: number;
  battery: number;
}

export const HardwareView: React.FC = () => {
  const { lastMessage, status } = useMQTT();
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    // Generate initial flatline data
    const initial = Array.from({ length: 20 }).map(() => ({
      time: '',
      cpu: 0,
      ram: 0,
      temp: 0,
      wifi: -100,
      battery: 100
    }));
    setData(initial);
  }, []);

  useEffect(() => {
    if (lastMessage && lastMessage.topic.includes('telemetry')) {
      try {
        const payload = JSON.parse(lastMessage.payload);
        const now = new Date();
        const newPoint = {
          time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`,
          cpu: payload.cpu || 0,
          ram: payload.ram || 0,
          temp: payload.temp || 0,
          wifi: payload.wifi || -100,
          battery: payload.battery_percent ?? (data.length > 0 ? data[data.length - 1].battery : 100)
        };

        setData(prev => {
          const next = [...prev, newPoint];
          if (next.length > 30) next.shift(); // Keep last 30 points
          return next;
        });
      } catch (e) {}
    }
  }, [lastMessage]);

  const latest = data[data.length - 1] || { cpu: 0, ram: 0, temp: 0, wifi: -100, battery: 100 };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard icon={Cpu} label="CPU Load" value={`${latest.cpu}%`} color="text-zinc-900 dark:text-zinc-50" />
        <StatCard icon={Zap} label="RAM Usage" value={`${latest.ram}%`} color="text-zinc-700 dark:text-zinc-300" />
        <StatCard icon={ThermometerSun} label="Temperature" value={`${latest.temp}°C`} color="text-orange-500" />
        <StatCard icon={Wifi} label="WiFi RSSI" value={`${latest.wifi} dBm`} color="text-blue-500" />
        <StatCard icon={Battery} label="Battery" value={`${latest.battery}%`} color="text-green-500" />
      </div>

      <Card className="h-[400px] flex flex-col p-6 relative">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-zinc-500" />
            <h3 className="text-sm text-zinc-900 dark:text-zinc-50 uppercase tracking-tight font-semibold">Live Telemetry Stream</h3>
          </div>
          <div className={`px-2 py-1 rounded-md border text-[10px] uppercase tracking-wider font-semibold ${
            status === 'connected' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/50 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400'
          }`}>
            {status}
          </div>
        </div>

        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" opacity={0.5} />
              <XAxis dataKey="time" stroke="currentColor" className="text-zinc-400 dark:text-zinc-600" fontSize={10} tickLine={false} />
              <YAxis stroke="currentColor" className="text-zinc-400 dark:text-zinc-600" fontSize={10} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-tooltip)', border: '1px solid var(--border-tooltip)', borderRadius: '8px', color: 'var(--text-tooltip)' }}
                itemStyle={{ fontSize: 12, fontFamily: 'monospace' }}
                wrapperClassName="dark:[--bg-tooltip:#09090b] dark:[--border-tooltip:#27272a] dark:[--text-tooltip:#fafafa] [--bg-tooltip:#ffffff] [--border-tooltip:#e4e4e7] [--text-tooltip:#09090b]"
              />
              <Line type="monotone" dataKey="cpu" stroke="#18181b" strokeWidth={2} dot={false} isAnimationActive={false} className="dark:stroke-zinc-100" />
              <Line type="monotone" dataKey="ram" stroke="#52525b" strokeWidth={2} dot={false} isAnimationActive={false} className="dark:stroke-zinc-400" />
              <Line type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="wifi" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="battery" stroke="#22c55e" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <Card className="flex flex-col items-center justify-center p-6 gap-4">
    <Icon className={`w-6 h-6 ${color}`} />
    <div className="text-center">
      <div className="text-3xl font-mono font-medium text-zinc-900 dark:text-zinc-50">{value}</div>
      <div className="text-[11px] uppercase text-zinc-500 tracking-wider font-medium mt-1">{label}</div>
    </div>
  </Card>
);
