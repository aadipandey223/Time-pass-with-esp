import React, { useState, useEffect } from 'react';
import { Card } from '../Layout/Card';
import { CloudRain, Wind, Droplets, Sun, Navigation, Cloud, AlertTriangle } from 'lucide-react';
import { useMQTT } from '@/context/MQTTContext';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { getGPSLocation } from '@/lib/engines/gps-service';
import { getWeatherData } from '@/lib/engines/weather-engine';
import type { WeatherData, WeatherConfig } from '@/lib/engines/weather-engine';
import toast from 'react-hot-toast';

export const WeatherRadar: React.FC = () => {
  const { publish } = useMQTT();
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        const { data: settings } = await supabase.from('user_settings').select('weather_configs').limit(1).maybeSingle();
        const configs: WeatherConfig[] = settings?.weather_configs || [];
        
        if (configs.length === 0) {
          throw new Error('No Weather API configured in Settings');
        }

        const coords = await getGPSLocation();
        const weatherData = await getWeatherData(configs, coords.lat, coords.lon);
        setData(weatherData);
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to fetch weather');
        setData({ temp: 0, feelsLike: 0, humidity: 0, wind: 0, aqi: 0, description: 'Offline', forecast: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const pushToESP = () => {
    publish('myhome/smarthub_xyz/cmd', JSON.stringify({ action: 'set_mode', mode: 'weather' }));
    toast.success('Weather pushed to ESP32 screen');
  };

  return (
    <Card className="flex flex-col min-h-[320px]">
      <div className="flex justify-between items-center mb-6 z-10">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 uppercase tracking-tight text-sm">Local Radar</h3>
        {loading ? (
          <Navigation className="w-4 h-4 text-zinc-400 animate-spin" />
        ) : error ? (
          <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
        ) : (
          <Navigation className="w-4 h-4 text-blue-500" />
        )}
      </div>

      <div className="flex items-center justify-between z-10 mb-8">
        <div className="flex flex-col">
          <div className="text-6xl font-medium tracking-tighter text-zinc-900 dark:text-zinc-50 font-mono">
            {data ? data.temp : '--'}°
          </div>
          <div className="text-sm text-zinc-500 tracking-wide capitalize mt-1">
            {data ? data.description : 'Loading...'}
          </div>
        </div>
        <div className="relative w-16 h-16 flex items-center justify-center">
          {(data?.description.toLowerCase().includes('cloud') || data?.description.toLowerCase().includes('rain')) ? (
            <Cloud className="w-full h-full text-zinc-400" />
          ) : (
            <Sun className="w-full h-full text-yellow-500" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-auto z-10">
        <div className="flex flex-col items-center bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <Droplets className="w-4 h-4 text-blue-500 mb-2" />
          <span className="text-sm font-semibold font-mono text-zinc-900 dark:text-zinc-50">{data ? data.humidity : '--'}%</span>
          <span className="text-[10px] uppercase text-zinc-500 tracking-wider">Humidity</span>
        </div>
        <div className="flex flex-col items-center bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <Wind className="w-4 h-4 text-zinc-400 mb-2" />
          <span className="text-sm font-semibold font-mono text-zinc-900 dark:text-zinc-50">{data ? data.wind : '--'}</span>
          <span className="text-[10px] uppercase text-zinc-500 tracking-wider">km/h</span>
        </div>
        <div className="flex flex-col items-center bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <CloudRain className="w-4 h-4 text-indigo-500 mb-2" />
          <span className="text-sm font-semibold font-mono text-zinc-900 dark:text-zinc-50">{data ? data.aqi : '--'}</span>
          <span className="text-[10px] uppercase text-zinc-500 tracking-wider">AQI</span>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={pushToESP}
        className="w-full mt-6 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium text-sm transition-colors z-10"
      >
        Push to ESP32
      </motion.button>
    </Card>
  );
};
