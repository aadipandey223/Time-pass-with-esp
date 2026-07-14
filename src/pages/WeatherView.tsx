import React, { useState, useEffect } from 'react';
import { Card } from '../components/Layout/Card';
import { CloudRain, Wind, Droplets, Sun, Navigation, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getGPSLocation, type Coordinates } from '@/lib/engines/gps-service';
import { getWeatherData, type WeatherData, type WeatherConfig } from '@/lib/engines/weather-engine';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { useMQTT } from '@/context/MQTTContext';

export const WeatherView: React.FC = () => {
  const { publish } = useMQTT();
  const [data, setData] = useState<WeatherData | null>(null);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const { data: settings } = await supabase.from('user_settings').select('weather_configs').limit(1).maybeSingle();
        const configs: WeatherConfig[] = settings?.weather_configs || [];
        
        if (configs.length === 0) throw new Error('No APIs Configured');

        const location = await getGPSLocation();
        setCoords(location);

        const weatherData = await getWeatherData(configs, location.lat, location.lon);
        setData(weatherData);
        
        // Sync weather to ESP32
        publish('myhome/smarthub_xyz/weather_sync', JSON.stringify({
          temp: weatherData.temp,
          feelsLike: weatherData.feelsLike,
          desc: weatherData.description
        }));
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [publish]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Navigation className="w-8 h-8 text-zinc-400 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-zinc-500 text-xl font-medium">Please configure a Weather API in Settings.</div>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 flex flex-col justify-center items-center py-12 relative overflow-hidden">
          <div className="absolute top-4 left-4 flex items-center gap-2 text-zinc-500 text-[10px] font-medium tracking-widest uppercase">
            <MapPin className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-50" />
            Lat {coords?.lat.toFixed(2)}, Lon {coords?.lon.toFixed(2)}
          </div>
          
          <div className="relative w-24 h-24 mb-8 text-zinc-900 dark:text-zinc-50">
            {(data.description.toLowerCase().includes('cloud') || data.description.toLowerCase().includes('rain')) ? (
              <CloudRain className="w-full h-full text-zinc-400" />
            ) : (
              <Sun className="w-full h-full text-yellow-500" />
            )}
          </div>
          
          <h1 className="text-7xl font-semibold tracking-tighter text-zinc-900 dark:text-zinc-50 mb-2 font-mono">
            {data.temp}°
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 capitalize font-medium tracking-wide">{data.description}</p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-2 tracking-wide">Feels like {data.feelsLike}°</p>
        </Card>

        <div className="lg:col-span-2 grid grid-cols-2 gap-6">
          <Card className="flex flex-col items-center justify-center gap-4">
            <Droplets className="w-6 h-6 text-blue-500" />
            <div className="text-center">
              <div className="text-3xl font-mono font-medium text-zinc-900 dark:text-zinc-50">{data.humidity}%</div>
              <div className="text-[11px] uppercase font-medium text-zinc-500 tracking-wider mt-1">Humidity</div>
            </div>
          </Card>
          <Card className="flex flex-col items-center justify-center gap-4">
            <Wind className="w-6 h-6 text-zinc-400" />
            <div className="text-center">
              <div className="text-3xl font-mono font-medium text-zinc-900 dark:text-zinc-50">{data.wind} <span className="text-lg">km/h</span></div>
              <div className="text-[11px] uppercase font-medium text-zinc-500 tracking-wider mt-1">Wind Speed</div>
            </div>
          </Card>
          <Card className="col-span-2 flex flex-col items-center justify-center gap-4 py-8">
            <h3 className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider absolute top-4 left-6">Air Quality Index</h3>
            <div className="text-5xl font-mono font-medium text-zinc-900 dark:text-zinc-50">{data.aqi}</div>
            <div className="w-full max-w-md h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full mt-4 overflow-hidden">
              <div 
                className="h-full bg-indigo-500" 
                style={{ width: `${Math.min(100, (data.aqi / 300) * 100)}%` }}
              />
            </div>
          </Card>
        </div>
      </div>

      <Card className="h-[300px] flex flex-col p-6">
        <h3 className="text-sm text-zinc-900 dark:text-zinc-50 uppercase tracking-tight font-semibold mb-6">24-Hour Forecast</h3>
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.forecast || []}>
              <defs>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#18181b" stopOpacity={0.1} className="dark:stop-color-zinc-100" />
                  <stop offset="95%" stopColor="#18181b" stopOpacity={0} className="dark:stop-color-zinc-100" />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="currentColor" className="text-zinc-400 dark:text-zinc-600" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="currentColor" className="text-zinc-400 dark:text-zinc-600" fontSize={11} tickLine={false} axisLine={false} width={40} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-tooltip)', border: '1px solid var(--border-tooltip)', borderRadius: '8px', color: 'var(--text-tooltip)' }}
                wrapperClassName="dark:[--bg-tooltip:#09090b] dark:[--border-tooltip:#27272a] dark:[--text-tooltip:#fafafa] [--bg-tooltip:#ffffff] [--border-tooltip:#e4e4e7] [--text-tooltip:#09090b]"
                itemStyle={{ color: 'inherit' }}
              />
              <Area type="monotone" dataKey="temp" stroke="#18181b" className="dark:stroke-zinc-100" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  );
};
