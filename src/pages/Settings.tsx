import React, { useState, useEffect } from 'react';
import { GlassPanel } from '../components/Layout/GlassPanel';
import { Settings as SettingsIcon, Save, Server, Key, Cloud } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

export const Settings: React.FC = () => {
  const [mqttBroker, setMqttBroker] = useState('wss://test.mosquitto.org:8081');
  const [weatherApi, setWeatherApi] = useState('');
  const [aiProvider, setAiProvider] = useState('openai');
  const [aiApiKey, setAiApiKey] = useState('');
  const [settingsId, setSettingsId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase.from('user_settings').select('*').limit(1).maybeSingle();
      if (data && !error) {
        setSettingsId(data.id);
        if (data.mqtt_broker) setMqttBroker(data.mqtt_broker);
        if (data.weather_api_key) setWeatherApi(data.weather_api_key);
        if (data.ai_provider) setAiProvider(data.ai_provider);
        if (data.ai_api_key) setAiApiKey(data.ai_api_key);
      }
    };
    fetchSettings();
  }, []);

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const settingsData = {
      mqtt_broker: mqttBroker,
      weather_api_key: weatherApi,
      ai_provider: aiProvider,
      ai_api_key: aiApiKey
    };

    let error;
    if (settingsId) {
      const { error: updateError } = await supabase.from('user_settings').update(settingsData).eq('id', settingsId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('user_settings').insert([settingsData]);
      error = insertError;
    }

    if (error) {
      toast.error('Failed to save settings to database.', { id: 'settings-save' });
      console.error(error);
      return;
    }
    
    toast.success('Settings saved successfully! Refreshing connection...', { id: 'settings-save' });
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="w-8 h-8 text-neon-cyan" />
        <h1 className="text-3xl font-light tracking-wider text-glow">System Settings</h1>
      </div>

      <form onSubmit={saveSettings} className="space-y-6 pb-20">
        <GlassPanel>
          <div className="flex items-center gap-3 mb-6">
            <Server className="w-5 h-5 text-neon-magenta" />
            <h2 className="text-lg font-semibold uppercase tracking-widest text-white/90">MQTT Configuration</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">WebSocket Broker URL</label>
              <input 
                type="text" 
                value={mqttBroker}
                onChange={(e) => setMqttBroker(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm font-mono focus:outline-none focus:border-neon-magenta/50 focus:ring-1 focus:ring-neon-magenta/50 transition-all text-white/90"
              />
              <p className="text-xs text-white/40 mt-2">Example: wss://test.mosquitto.org:8081</p>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel>
          <div className="flex items-center gap-3 mb-6">
            <Cloud className="w-5 h-5 text-neon-blue" />
            <h2 className="text-lg font-semibold uppercase tracking-widest text-white/90">Weather Provider</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">OpenWeather API Key</label>
              <input 
                type="password" 
                value={weatherApi}
                onChange={(e) => setWeatherApi(e.target.value)}
                placeholder="Enter API Key"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm font-mono focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/50 transition-all text-white/90"
              />
            </div>
          </div>
        </GlassPanel>

        <GlassPanel>
          <div className="flex items-center gap-3 mb-6">
            <Key className="w-5 h-5 text-neon-purple" />
            <h2 className="text-lg font-semibold uppercase tracking-widest text-white/90">AI Core Provider</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">Provider</label>
              <select 
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-neon-purple/50 focus:ring-1 focus:ring-neon-purple/50 transition-all text-white/90"
              >
                <option value="openai">OpenAI (GPT-4)</option>
                <option value="gemini">Google Gemini</option>
                <option value="claude">Anthropic Claude</option>
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">API Key</label>
              <input 
                type="password" 
                value={aiApiKey}
                onChange={(e) => setAiApiKey(e.target.value)}
                placeholder="Enter API Key"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm font-mono focus:outline-none focus:border-neon-purple/50 focus:ring-1 focus:ring-neon-purple/50 transition-all text-white/90"
              />
            </div>
          </div>
        </GlassPanel>

        <div className="flex justify-end pt-4">
          <button 
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 font-bold uppercase tracking-widest text-sm hover:bg-neon-cyan/30 hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
