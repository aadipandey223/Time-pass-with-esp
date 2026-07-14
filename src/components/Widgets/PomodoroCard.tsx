import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../Layout/Card';
import { Play, Pause, Square, SkipForward, Settings as SettingsIcon, CheckCircle2, Circle, Plus, Trash2, Volume2, VolumeX, ListTodo, X } from 'lucide-react';
import { useMQTT } from '@/context/MQTTContext';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export const PomodoroCard: React.FC = () => {
  const { publish } = useMQTT();
  
  // Settings
  const [workTime, setWorkTime] = useState(25);
  const [shortBreakTime, setShortBreakTime] = useState(5);
  const [longBreakTime, setLongBreakTime] = useState(15);
  const [sessionsBeforeLongBreak, setSessionsBeforeLongBreak] = useState(4);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Timer State
  const [mode, setMode] = useState<'focus' | 'short_break' | 'long_break'>('focus');
  const [timeLeft, setTimeLeft] = useState(workTime * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);

  // Task State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // UI State
  const [showModal, setShowModal] = useState(false);
  
  const alarmAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    alarmAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    
    // Load persisted state
    const saved = localStorage.getItem('pomodoro_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setWorkTime(parsed.workTime || 25);
        setShortBreakTime(parsed.shortBreakTime || 5);
        setLongBreakTime(parsed.longBreakTime || 15);
        setSessionsBeforeLongBreak(parsed.sessionsBeforeLongBreak || 4);
        setSoundEnabled(parsed.soundEnabled ?? true);
        setTasks(parsed.tasks || []);
        setActiveTaskId(parsed.activeTaskId || null);
        setSessionsCompleted(parsed.sessionsCompleted || 0);
        setTotalFocusTime(parsed.totalFocusTime || 0);
      } catch (e) {
        console.error('Failed to load pomodoro state');
      }
    }
  }, []);

  // Persist on change
  useEffect(() => {
    localStorage.setItem('pomodoro_state', JSON.stringify({
      workTime, shortBreakTime, longBreakTime, sessionsBeforeLongBreak, soundEnabled, tasks, activeTaskId, sessionsCompleted, totalFocusTime
    }));
  }, [workTime, shortBreakTime, longBreakTime, sessionsBeforeLongBreak, soundEnabled, tasks, activeTaskId, sessionsCompleted, totalFocusTime]);

  const getTotalSecondsForMode = () => {
    if (mode === 'focus') return workTime * 60;
    if (mode === 'short_break') return shortBreakTime * 60;
    return longBreakTime * 60;
  };

  const progress = ((getTotalSecondsForMode() - timeLeft) / getTotalSecondsForMode()) * 100;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
        if (mode === 'focus') {
          setTotalFocusTime((prev) => prev + 1);
        }
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  useEffect(() => {
    if (isActive) {
      const currentTaskText = tasks.find(t => t.id === activeTaskId)?.text || "";
      publish('myhome/smarthub_xyz/pomodoro_sync', JSON.stringify({
        timeLeft,
        mode,
        task: currentTaskText
      }));
    }
  }, [timeLeft, mode, activeTaskId, isActive, tasks, publish]);

  const playSound = () => {
    if (soundEnabled && alarmAudio.current) {
      alarmAudio.current.currentTime = 0;
      alarmAudio.current.play().catch(() => {});
    }
  };

  const handleSessionComplete = () => {
    setIsActive(false);
    playSound();

    if (mode === 'focus') {
      publish('myhome/smarthub_xyz/pomodoro', JSON.stringify({ action: 'pomodoro_finished' }));
      const newSessionsCompleted = sessionsCompleted + 1;
      setSessionsCompleted(newSessionsCompleted);
      
      supabase.from('pomodoro_history').insert([{ mode: 'focus', duration_seconds: workTime * 60 }]).then();

      if (newSessionsCompleted % sessionsBeforeLongBreak === 0) {
        setMode('long_break');
        setTimeLeft(longBreakTime * 60);
      } else {
        setMode('short_break');
        setTimeLeft(shortBreakTime * 60);
      }
    } else {
      setMode('focus');
      setTimeLeft(workTime * 60);
      supabase.from('pomodoro_history').insert([{ mode: mode, duration_seconds: getTotalSecondsForMode() }]).then();
    }
  };

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(getTotalSecondsForMode());
  };

  const skipSession = () => {
    handleSessionComplete();
  };

  // Ensure timeLeft updates if settings change while timer is stopped
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(getTotalSecondsForMode());
    }
  }, [workTime, shortBreakTime, longBreakTime, mode]);

  // Task Management
  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const newTask = { id: Date.now().toString(), text: newTaskText.trim(), completed: false };
    setTasks([...tasks, newTask]);
    setNewTaskText('');
    if (!activeTaskId) setActiveTaskId(newTask.id);
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    if (activeTaskId === id) {
      setActiveTaskId(null); // Deselect if completed
    }
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    if (activeTaskId === id) setActiveTaskId(null);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const activeTask = tasks.find(t => t.id === activeTaskId);

  return (
    <Card className="relative flex flex-col min-h-[320px] overflow-hidden">
      {/* Front Card */}
      <div className="flex justify-between items-center mb-2 z-10">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 uppercase tracking-tight text-sm">Pomodoro</h3>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${mode === 'focus' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-700' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-500 border border-green-200 dark:border-green-800/50'}`}>
            {mode.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button onClick={() => setShowModal(true)} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 my-4">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle cx="80" cy="80" r="72" className="stroke-zinc-100 dark:stroke-zinc-800" strokeWidth="6" fill="none" />
            <motion.circle
              cx="80"
              cy="80"
              r="72"
              className={mode === 'focus' ? 'stroke-zinc-900 dark:stroke-zinc-100' : 'stroke-green-500'}
              strokeWidth="6"
              fill="none"
              strokeDasharray="452"
              strokeDashoffset={452 - (452 * progress) / 100}
              strokeLinecap="round"
              initial={{ strokeDashoffset: 452 }}
              animate={{ strokeDashoffset: 452 - (452 * progress) / 100 }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </svg>
          <div className="text-4xl font-semibold font-mono text-zinc-900 dark:text-zinc-50">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>

        {/* Active Task Display */}
        <div className="mt-4 text-center max-w-[80%] h-6">
          {activeTask ? (
            <p className="text-xs text-zinc-700 dark:text-zinc-300 truncate font-medium flex items-center justify-center gap-1.5">
              <span className="text-zinc-900 dark:text-zinc-50">►</span> {activeTask.text}
            </p>
          ) : (
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest cursor-pointer hover:text-zinc-600 dark:hover:text-zinc-300" onClick={() => setShowModal(true)}>
              No active task
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-4 justify-center z-10 mb-2">
        <button
          onClick={toggleTimer}
          className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors border border-zinc-200 dark:border-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-50"
        >
          {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-1" />}
        </button>
        <button
          onClick={resetTimer}
          className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors border border-zinc-200 dark:border-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-50"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={skipSession}
          className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors border border-zinc-200 dark:border-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-50"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      <div className="flex justify-between w-full text-[10px] uppercase tracking-wider text-zinc-500 z-10 mt-2 px-2">
        <span>Today: {sessionsCompleted}</span>
        <span>{Math.floor(totalFocusTime / 60)}m focus</span>
      </div>

      {/* Settings & Tasks Modal Overlay */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute inset-0 z-50 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-md flex flex-col p-4 border border-zinc-200 dark:border-zinc-800 overflow-y-auto custom-scrollbar"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 uppercase tracking-widest text-sm flex items-center gap-2">
                <SettingsIcon className="w-4 h-4" /> Configure
              </h3>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50 p-1 rounded-md transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Work (m)</label>
                  <input type="number" value={workTime} onChange={(e) => setWorkTime(Number(e.target.value))} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm text-zinc-900 dark:text-zinc-50 focus:border-zinc-400 dark:focus:border-zinc-600 outline-none" min={1} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Short Break (m)</label>
                  <input type="number" value={shortBreakTime} onChange={(e) => setShortBreakTime(Number(e.target.value))} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm text-zinc-900 dark:text-zinc-50 focus:border-zinc-400 dark:focus:border-zinc-600 outline-none" min={1} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Long Break (m)</label>
                  <input type="number" value={longBreakTime} onChange={(e) => setLongBreakTime(Number(e.target.value))} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm text-zinc-900 dark:text-zinc-50 focus:border-zinc-400 dark:focus:border-zinc-600 outline-none" min={1} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider">Sessions to Long</label>
                  <input type="number" value={sessionsBeforeLongBreak} onChange={(e) => setSessionsBeforeLongBreak(Number(e.target.value))} className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm text-zinc-900 dark:text-zinc-50 focus:border-zinc-400 dark:focus:border-zinc-600 outline-none" min={1} />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <h4 className="text-xs uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2 font-medium">
                  <ListTodo className="w-3 h-3" /> Task List
                </h4>
                
                <form onSubmit={addTask} className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="Add new task..."
                    className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-50 focus:border-zinc-400 dark:focus:border-zinc-600 outline-none placeholder:text-zinc-400"
                  />
                  <button type="submit" disabled={!newTaskText.trim()} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 disabled:opacity-50 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </form>

                <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                  {tasks.map(task => (
                    <div key={task.id} className={`flex items-center gap-2 p-2 rounded-lg border ${activeTaskId === task.id ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}>
                      <button onClick={() => toggleTask(task.id)} className="text-zinc-400 hover:text-green-500">
                        {task.completed ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4" />}
                      </button>
                      
                      <span className={`flex-1 text-sm ${task.completed ? 'text-zinc-400 line-through' : 'text-zinc-700 dark:text-zinc-300'} cursor-pointer`} onClick={() => !task.completed && setActiveTaskId(task.id)}>
                        {task.text}
                      </span>
                      
                      <button onClick={() => deleteTask(task.id)} className="text-zinc-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {tasks.length === 0 && (
                    <p className="text-center text-xs text-zinc-400 italic py-2">No tasks added</p>
                  )}
                </div>
              </div>
              
              <div className="pt-2">
                 <button onClick={() => {
                   setSessionsCompleted(0);
                   setTotalFocusTime(0);
                   toast.success('Stats reset for the day!');
                 }} className="w-full text-[10px] uppercase tracking-widest text-zinc-500 hover:text-red-500 transition-colors text-center py-2 font-medium">
                   Reset Daily Stats
                 </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </Card>
  );
};
