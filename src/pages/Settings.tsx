import React, { useState, useEffect } from 'react';
import { Card } from '../components/Layout/Card';
import { Settings as SettingsIcon, Save, Server, Key, Cloud, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import type { AIConfig } from '../lib/engines/ai-engine';
import type { WeatherConfig } from '../lib/engines/weather-engine';

export const Settings: React.FC = () => {
  const [mqttBroker, setMqttBroker] = useState('wss://test.mosquitto.org:8081');
  const [aiConfigs, setAiConfigs] = useState<AIConfig[]>([]);
  const [weatherConfigs, setWeatherConfigs] = useState<WeatherConfig[]>([]);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase.from('user_settings').select('*').limit(1).maybeSingle();
      if (data && !error) {
        setSettingsId(data.id);
        if (data.mqtt_broker) setMqttBroker(data.mqtt_broker);
        if (data.ai_configs) setAiConfigs(data.ai_configs as AIConfig[]);
        if (data.weather_configs) setWeatherConfigs(data.weather_configs as WeatherConfig[]);
      }
    };
    fetchSettings();
  }, []);

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const settingsData = {
      mqtt_broker: mqttBroker,
      ai_configs: aiConfigs,
      weather_configs: weatherConfigs
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
    
    toast.success('Settings saved successfully! Refreshing...', { id: 'settings-save' });
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const addAiConfig = () => setAiConfigs([...aiConfigs, { provider: 'openai', key: '' }]);
  const updateAiConfig = (index: number, field: keyof AIConfig, value: string) => {
    const newConfigs = [...aiConfigs];
    newConfigs[index] = { ...newConfigs[index], [field]: value };
    setAiConfigs(newConfigs);
  };
  const removeAiConfig = (index: number) => setAiConfigs(aiConfigs.filter((_, i) => i !== index));

  const addWeatherConfig = () => setWeatherConfigs([...weatherConfigs, { provider: 'openweathermap', key: '' }]);
  const updateWeatherConfig = (index: number, field: keyof WeatherConfig, value: string) => {
    const newConfigs = [...weatherConfigs];
    newConfigs[index] = { ...newConfigs[index], [field]: value };
    setWeatherConfigs(newConfigs);
  };
  const removeWeatherConfig = (index: number) => setWeatherConfigs(weatherConfigs.filter((_, i) => i !== index));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <SettingsIcon className="w-8 h-8 text-neon-cyan" />
        <h1 className="text-3xl font-light tracking-wider text-glow">System Settings</h1>
      </div>

      <form onSubmit={saveSettings} className="space-y-6 pb-20">
        <Card>
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
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Cloud className="w-5 h-5 text-neon-blue" />
              <h2 className="text-lg font-semibold uppercase tracking-widest text-white/90">Weather Providers</h2>
            </div>
            <button type="button" onClick={addWeatherConfig} className="p-2 bg-neon-blue/20 text-neon-blue rounded-full hover:bg-neon-blue/40 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-white/40 mb-4">Add multiple keys. The system will fallback to the next provider if the primary one fails.</p>
          <div className="space-y-4">
            {weatherConfigs.map((config, index) => (
              <div key={index} className="flex gap-4 items-center bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex-1 space-y-2">
                  <select 
                    value={config.provider}
                    onChange={(e) => updateWeatherConfig(index, 'provider', e.target.value as any)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-neon-blue/50 text-white/90"
                  >
                    <option value="openweathermap">OpenWeatherMap</option>
                    <option value="weatherapi">WeatherAPI</option>
                  </select>
                  <input 
                    type="password" 
                    value={config.key}
                    onChange={(e) => updateWeatherConfig(index, 'key', e.target.value)}
                    placeholder="API Key"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-sm font-mono focus:outline-none focus:border-neon-blue/50 text-white/90"
                  />
                </div>
                <button type="button" onClick={() => removeWeatherConfig(index)} className="p-3 text-red-500 hover:bg-red-500/20 rounded-xl transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            {weatherConfigs.length === 0 && (
              <div className="text-center py-4 text-white/30 text-sm italic">No weather providers configured.</div>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-neon-purple" />
              <h2 className="text-lg font-semibold uppercase tracking-widest text-white/90">AI Core Providers</h2>
            </div>
            <button type="button" onClick={addAiConfig} className="p-2 bg-neon-purple/20 text-neon-purple rounded-full hover:bg-neon-purple/40 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-white/40 mb-4">Add multiple keys. The system will fallback to the next provider if the primary one fails or hits rate limits.</p>
          <div className="space-y-4">
            {aiConfigs.map((config, index) => (
              <div key={index} className="flex gap-4 items-center bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex-1 space-y-2">
                  <select 
                    value={config.provider}
                    onChange={(e) => updateAiConfig(index, 'provider', e.target.value as any)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-neon-purple/50 text-white/90"
                  >
                    <option value="openai">OpenAI (GPT-4o Mini)</option>
                    <option value="gemini">Google Gemini (1.5 Flash)</option>
                    <option value="groq">Groq (Fast Inference)</option>
                  </select>
                  <input 
                    type="password" 
                    value={config.key}
                    onChange={(e) => updateAiConfig(index, 'key', e.target.value)}
                    placeholder="API Key"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-sm font-mono focus:outline-none focus:border-neon-purple/50 text-white/90"
                  />
                </div>
                <button type="button" onClick={() => removeAiConfig(index)} className="p-3 text-red-500 hover:bg-red-500/20 rounded-xl transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            {aiConfigs.length === 0 && (
              <div className="text-center py-4 text-white/30 text-sm italic">No AI providers configured.</div>
            )}
          </div>
        </Card>

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
