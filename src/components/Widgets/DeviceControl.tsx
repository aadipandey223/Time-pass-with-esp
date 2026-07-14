import React, { useState, useEffect } from 'react';
import { Card } from '../Layout/Card';
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
    <Card className="flex flex-col min-h-[320px]">
      <div className="flex justify-between items-center mb-6 z-10">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 uppercase tracking-tight text-sm">Device Control</h3>
        <Sliders className="w-4 h-4 text-zinc-500" />
      </div>

      <div className="space-y-6 flex-1 z-10">
        <div className="space-y-3">
          <div className="flex justify-between text-xs uppercase tracking-wider text-zinc-500 font-medium">
            <span className="flex items-center gap-2"><Sun className="w-3.5 h-3.5" /> Display Brightness</span>
            <span className="text-zinc-900 dark:text-zinc-50">{brightness}%</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={brightness} 
            onChange={handleBrightness}
            className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-zinc-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-auto pt-4">
          <ControlButton icon={Power} label="Reboot" color="hover:border-red-500/50 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400" iconColor="group-hover:text-red-500" onClick={() => executeCommand('reboot')} />
          <ControlButton icon={RefreshCw} label="Restart MQTT" color="hover:border-yellow-500/50 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 hover:text-yellow-600 dark:hover:text-yellow-400" iconColor="group-hover:text-yellow-500" onClick={() => executeCommand('restart_mqtt')} />
          <ControlButton icon={Smartphone} label="OTA Update" color="hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-600 dark:hover:text-blue-400" iconColor="group-hover:text-blue-500" onClick={() => executeCommand('ota_update')} />
          <ControlButton icon={Sliders} label="Factory Reset" color="hover:border-purple-500/50 hover:bg-purple-50 dark:hover:bg-purple-900/10 hover:text-purple-600 dark:hover:text-purple-400" iconColor="group-hover:text-purple-500" onClick={() => executeCommand('factory_reset')} />
        </div>
      </div>
    </Card>
  );
};

const ControlButton = ({ icon: Icon, label, color, iconColor, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 ${color} transition-all group`}
  >
    <Icon className={`w-5 h-5 mb-2 text-zinc-400 ${iconColor} transition-colors`} />
    <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500 group-hover:text-inherit transition-colors text-center">{label}</span>
  </button>
);
