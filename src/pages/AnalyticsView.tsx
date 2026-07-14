import React, { useState, useEffect } from 'react';
import { Card } from '../components/Layout/Card';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Clock, TrendingUp, Trophy } from 'lucide-react';

interface PomodoroSession {
  id: string;
  created_at: string;
  mode: string;
  duration_seconds: number;
}

export const AnalyticsView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalFocus: 0,
    totalBreaks: 0,
    sessionsCompleted: 0
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('pomodoro_history')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (error) throw error;

        let tFocus = 0;
        let tBreaks = 0;
        let sCompleted = 0;

        const dailyMap = new Map<string, { focus: number, break: number }>();

        (data as PomodoroSession[]).forEach(session => {
          const date = new Date(session.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
          if (!dailyMap.has(date)) {
            dailyMap.set(date, { focus: 0, break: 0 });
          }
          
          const current = dailyMap.get(date)!;
          const minutes = Math.round(session.duration_seconds / 60);

          if (session.mode === 'focus') {
            current.focus += minutes;
            tFocus += minutes;
            sCompleted += 1;
          } else {
            current.break += minutes;
            tBreaks += minutes;
          }
        });

        const formattedData = Array.from(dailyMap.entries()).map(([date, times]) => ({
          date,
          focus: times.focus,
          break: times.break
        })).slice(-7);

        setChartData(formattedData);
        setStats({
          totalFocus: tFocus,
          totalBreaks: tBreaks,
          sessionsCompleted: sCompleted
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-3 mb-8">
        <TrendingUp className="w-6 h-6 text-zinc-900 dark:text-zinc-50" />
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Productivity Analytics</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-4 p-6">
          <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-700">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-mono font-medium text-zinc-900 dark:text-zinc-50">{Math.floor(stats.totalFocus / 60)}h {stats.totalFocus % 60}m</div>
            <div className="text-[11px] uppercase font-medium text-zinc-500 tracking-wider mt-1">Total Focus Time</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-6">
          <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-700">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-mono font-medium text-zinc-900 dark:text-zinc-50">{stats.sessionsCompleted}</div>
            <div className="text-[11px] uppercase font-medium text-zinc-500 tracking-wider mt-1">Pomodoros Completed</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-6">
          <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-700">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-mono font-medium text-zinc-900 dark:text-zinc-50">{Math.floor(stats.totalBreaks / 60)}h {stats.totalBreaks % 60}m</div>
            <div className="text-[11px] uppercase font-medium text-zinc-500 tracking-wider mt-1">Total Break Time</div>
          </div>
        </Card>
      </div>

      <Card className="h-[400px] flex flex-col p-6">
        <h3 className="text-sm text-zinc-900 dark:text-zinc-50 uppercase tracking-tight font-semibold mb-6">Last 7 Days (Minutes)</h3>
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-zinc-400 animate-pulse" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
            No productivity data found yet. Start a Pomodoro timer!
          </div>
        ) : (
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" vertical={false} opacity={0.5} />
                <XAxis dataKey="date" stroke="currentColor" className="text-zinc-400 dark:text-zinc-600" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="currentColor" className="text-zinc-400 dark:text-zinc-600" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'var(--hover-bg)' }}
                  contentStyle={{ backgroundColor: 'var(--bg-tooltip)', border: '1px solid var(--border-tooltip)', borderRadius: '8px', color: 'var(--text-tooltip)' }}
                  wrapperClassName="dark:[--bg-tooltip:#09090b] dark:[--border-tooltip:#27272a] dark:[--text-tooltip:#fafafa] [--bg-tooltip:#ffffff] [--border-tooltip:#e4e4e7] [--text-tooltip:#09090b] dark:[--hover-bg:rgba(255,255,255,0.05)] [--hover-bg:rgba(0,0,0,0.03)]"
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Bar dataKey="focus" name="Focus Time (min)" fill="#18181b" radius={[4, 4, 0, 0]} barSize={30} className="dark:fill-zinc-100" />
                <Bar dataKey="break" name="Break Time (min)" fill="#71717a" radius={[4, 4, 0, 0]} barSize={30} className="dark:fill-zinc-600" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </motion.div>
  );
};
