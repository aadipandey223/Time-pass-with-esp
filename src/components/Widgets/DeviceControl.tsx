import React, { useState, useEffect } from 'react';
import { GlassPanel } from '../Layout/GlassPanel';
import { Sliders, Sun, Power, RefreshCw, Smartphone } from 'lucide-react';
import { useMQTT } from '@/context/MQTTContext';
import { supabase } from '@/lib/supabase';

export const DeviceControl: React.FC = () => {
  const { publish } = useMQTT();
  const [brightness, setBrightness] = useState(50);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    const fetchState = async () => {
      const { data } = await supabase.from('device_state').select('*').limit(1).maybeSingle();
      if (data) {
        setDeviceId(data.id);
        if (data.brightness !== undefined) setBrightness(data.brightness);
      }
    };
    fetchState();
  }, []);

  const handleBrightness = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setBrightness(val);
    publish('myhome/smarthub_xyz/cmd', JSON.stringify({ action: 'set_brightness', value: val }));

    if (deviceId) {
      await supabase.from('device_state').update({ brightness: val }).eq('id', deviceId);
    } else {
      const { data } = await supabase.from('device_state').insert([{ brightness: val }]).select();
      if (data && data[0]) setDeviceId(data[0].id);
    }
  };

  const executeCommand = (action: string) => {
    publish('myhome/smarthub_xyz/cmd', JSON.stringify({ action }));
  };

  return (
    <GlassPanel className="flex flex-col min-h-[320px]">
      <div className="flex justify-between items-center mb-6 z-10">
        <h3 className="font-semibold text-white/80 uppercase tracking-widest text-sm text-glow">Device Control</h3>
        <Sliders className="w-4 h-4 text-neon-cyan" />
      </div>

      <div className="space-y-6 flex-1 z-10">
        <div className="space-y-3">
          <div className="flex justify-between text-xs uppercase tracking-wider text-white/70">
            <span className="flex items-center gap-2"><Sun className="w-3 h-3" /> Display Brightness</span>
            <span>{brightness}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={brightness} 
            onChange={handleBrightness}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-cyan [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-neon-cyan [&::-webkit-slider-thumb]:shadow-[0_0_10px_#00E5FF]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-auto pt-4">
          <ControlButton icon={Power} label="Reboot" color="hover:border-neon-danger/50 hover:text-neon-danger" iconColor="group-hover:text-neon-danger" onClick={() => executeCommand('reboot')} />
          <ControlButton icon={RefreshCw} label="Restart MQTT" color="hover:border-neon-warning/50 hover:text-neon-warning" iconColor="group-hover:text-neon-warning" onClick={() => executeCommand('restart_mqtt')} />
          <ControlButton icon={Smartphone} label="OTA Update" color="hover:border-neon-blue/50 hover:text-neon-blue" iconColor="group-hover:text-neon-blue" onClick={() => executeCommand('ota_update')} />
          <ControlButton icon={Sliders} label="Factory Reset" color="hover:border-neon-purple/50 hover:text-neon-purple" iconColor="group-hover:text-neon-purple" onClick={() => executeCommand('factory_reset')} />
        </div>
      </div>
    </GlassPanel>
  );
};

const ControlButton = ({ icon: Icon, label, color, iconColor, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 ${color} transition-all group`}
  >
    <Icon className={`w-5 h-5 mb-2 text-white/50 ${iconColor} transition-colors`} />
    <span className="text-[10px] uppercase font-bold tracking-wider text-white/70 group-hover:text-white transition-colors text-center">{label}</span>
  </button>
);
