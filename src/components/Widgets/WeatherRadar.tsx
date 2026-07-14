import React, { useState } from 'react';
import { GlassPanel } from '../Layout/GlassPanel';
import { CloudRain, Wind, Droplets, Sun, Navigation } from 'lucide-react';
import { useMQTT } from '@/context/MQTTContext';
import { motion } from 'framer-motion';

export const WeatherRadar: React.FC = () => {
  const { publish } = useMQTT();
  const [data] = useState({
    temp: 24,
    feelsLike: 26,
    humidity: 65,
    wind: 12,
    aqi: 45
  });

  const pushToESP = () => {
    publish('myhome/smarthub_xyz/cmd', JSON.stringify({ action: 'set_mode', mode: 'weather' }));
  };

  return (
    <GlassPanel className="flex flex-col min-h-[320px]">
      <div className="flex justify-between items-center mb-6 z-10">
        <h3 className="font-semibold text-white/80 uppercase tracking-widest text-sm text-glow">Omni Radar</h3>
        <Navigation className="w-4 h-4 text-neon-blue animate-pulse" />
      </div>

      <div className="flex items-center justify-between z-10 mb-8">
        <div className="flex flex-col">
          <div className="text-6xl font-light tracking-tighter text-glow-blue">{data.temp}°</div>
          <div className="text-sm text-white/50 tracking-wider">Feels like {data.feelsLike}°</div>
        </div>
        <div className="relative w-20 h-20">
          <Sun className="absolute inset-0 w-full h-full text-neon-warning drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-auto z-10">
        <div className="flex flex-col items-center bg-white/5 p-3 rounded-xl border border-white/10">
          <Droplets className="w-5 h-5 text-neon-blue mb-2" />
          <span className="text-lg font-mono">{data.humidity}%</span>
          <span className="text-[10px] uppercase text-white/50 tracking-wider">Humidity</span>
        </div>
        <div className="flex flex-col items-center bg-white/5 p-3 rounded-xl border border-white/10">
          <Wind className="w-5 h-5 text-neon-cyan mb-2" />
          <span className="text-lg font-mono">{data.wind}</span>
          <span className="text-[10px] uppercase text-white/50 tracking-wider">km/h</span>
        </div>
        <div className="flex flex-col items-center bg-white/5 p-3 rounded-xl border border-white/10">
          <CloudRain className="w-5 h-5 text-neon-purple mb-2" />
          <span className="text-lg font-mono">{data.aqi}</span>
          <span className="text-[10px] uppercase text-white/50 tracking-wider">AQI</span>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={pushToESP}
        className="w-full mt-6 py-3 rounded-xl bg-neon-blue/10 text-neon-blue border border-neon-blue/50 font-semibold tracking-wider text-sm uppercase hover:bg-neon-blue/20 transition-colors z-10 shadow-[0_0_15px_rgba(0,184,255,0.15)]"
      >
        Push to ESP32
      </motion.button>

      {/* Radar Background Effect */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-neon-blue/30 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-neon-blue/20 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-neon-blue/10 rounded-full" />
        <div className="absolute top-1/2 left-1/2 w-32 h-[1px] bg-gradient-to-r from-neon-blue to-transparent origin-left animate-[spin_4s_linear_infinite]" />
      </div>
    </GlassPanel>
  );
};
