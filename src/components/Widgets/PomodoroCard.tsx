import React, { useState, useEffect } from 'react';
import { GlassPanel } from '../Layout/GlassPanel';
import { Play, Pause, Square, SkipForward } from 'lucide-react';
import { useMQTT } from '@/context/MQTTContext';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

export const PomodoroCard: React.FC = () => {
  const { publish } = useMQTT();
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');

  const totalTime = mode === 'focus' ? 25 * 60 : 5 * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (mode === 'focus') {
        publish('myhome/smarthub_xyz/cmd', JSON.stringify({ action: 'pomodoro_finished' }));
        setMode('break');
        setTimeLeft(5 * 60);
        supabase.from('pomodoro_history').insert([{ mode: 'focus', duration_seconds: 25 * 60 }]).then();
      } else {
        setMode('focus');
        setTimeLeft(25 * 60);
        setIsActive(false);
        supabase.from('pomodoro_history').insert([{ mode: 'break', duration_seconds: 5 * 60 }]).then();
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, publish]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const skipBreak = () => {
    setMode('focus');
    setTimeLeft(25 * 60);
    setIsActive(true);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <GlassPanel className="flex flex-col items-center justify-between min-h-[320px]">
      <div className="w-full flex justify-between items-center mb-4 z-10">
        <h3 className="font-semibold text-white/80 uppercase tracking-widest text-sm text-glow">Pomodoro Engine</h3>
        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full ${mode === 'focus' ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50' : 'bg-neon-success/20 text-neon-success border border-neon-success/50'}`}>
          {mode}
        </span>
      </div>

      <div className="relative w-48 h-48 flex items-center justify-center my-4 z-10">
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <circle cx="96" cy="96" r="88" className="stroke-white/10" strokeWidth="6" fill="none" />
          <motion.circle
            cx="96"
            cy="96"
            r="88"
            className={mode === 'focus' ? 'stroke-neon-cyan' : 'stroke-neon-success'}
            strokeWidth="6"
            fill="none"
            strokeDasharray="553"
            strokeDashoffset={553 - (553 * progress) / 100}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${mode === 'focus' ? '#00E5FF' : '#22C55E'})` }}
            initial={{ strokeDashoffset: 553 }}
            animate={{ strokeDashoffset: 553 - (553 * progress) / 100 }}
            transition={{ duration: 1, ease: 'linear' }}
          />
        </svg>
        <div className="text-5xl font-light font-mono text-glow">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
      </div>

      <div className="flex gap-4 mt-2 z-10">
        <button
          onClick={toggleTimer}
          className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10 hover:border-neon-cyan/50"
        >
          {isActive ? <Pause className="w-5 h-5 text-neon-cyan" /> : <Play className="w-5 h-5 text-neon-cyan ml-1" />}
        </button>
        <button
          onClick={resetTimer}
          className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10 hover:border-neon-danger/50"
        >
          <Square className="w-4 h-4 text-neon-danger" />
        </button>
        {mode === 'break' && (
          <button
            onClick={skipBreak}
            className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10 hover:border-neon-warning/50"
          >
            <SkipForward className="w-5 h-5 text-neon-warning" />
          </button>
        )}
      </div>
    </GlassPanel>
  );
};
