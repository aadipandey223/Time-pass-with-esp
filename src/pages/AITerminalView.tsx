import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/Layout/Card';
import { Terminal, Send, Cpu, Hash } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { queryAI } from '@/lib/engines/ai-engine';
import type { AIConfig } from '@/lib/engines/ai-engine';
import { getGPSLocation } from '@/lib/engines/gps-service';
import { motion } from 'framer-motion';

export const AITerminalView: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'ai'|'user'|'system', content: string, timestamp: Date }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const [configs, setConfigs] = useState<AIConfig[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('ai_terminal_history');
    if (saved) {
      try {
        setMessages(JSON.parse(saved).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      } catch (e) {}
    } else {
      setMessages([
        { role: 'system', content: 'INITIALIZING AI CORE...', timestamp: new Date() },
        { role: 'ai', content: 'Greetings. I am the Omni Smart Hub AI. How may I assist you today?', timestamp: new Date() }
      ]);
    }

    const initAI = async () => {
      const { data } = await supabase.from('user_settings').select('ai_configs').limit(1).maybeSingle();
      if (data?.ai_configs) {
        setConfigs(data.ai_configs as AIConfig[]);
      }
    };
    initAI();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('ai_terminal_history', JSON.stringify(messages));
    }
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    if (configs.length === 0) {
      setMessages(prev => [...prev, { role: 'system', content: 'ERR: No AI API keys configured. Please visit Settings.', timestamp: new Date() }]);
      return;
    }

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg, timestamp: new Date() }]);
    setInput('');
    setIsTyping(true);

    try {
      const { data: deviceState } = await supabase.from('device_state').select('*').limit(1).maybeSingle();
      let locationContext = '';
      try {
        const coords = await getGPSLocation();
        locationContext = `Lat ${coords.lat.toFixed(4)}, Lon ${coords.lon.toFixed(4)}`;
      } catch (e) {
        locationContext = 'Unknown';
      }

      const systemPrompt = `You are Omni AI, a highly advanced, professional smart home AI.
Context:
- Brightness: ${deviceState?.brightness ?? 'Unknown'}
- Location: ${locationContext}
Answer the user's query intelligently.`;

      const aiResponse = await queryAI(configs, systemPrompt, userMsg);
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse, timestamp: new Date() }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'system', content: `[CRITICAL FAULT] ${err.message}`, timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearHistory = () => {
    setMessages([{ role: 'system', content: 'MEMORY WIPED. REBOOTING...', timestamp: new Date() }]);
    localStorage.removeItem('ai_terminal_history');
  };

  return (
    <motion.div 
      className="h-[calc(100vh-8rem)] flex flex-col"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Card className="flex-1 flex flex-col p-0 overflow-hidden">
        
        {/* Terminal Header */}
        <div className="bg-zinc-50 dark:bg-[#09090b] border-b border-zinc-200 dark:border-zinc-800 p-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-zinc-900 dark:text-zinc-50" />
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50 uppercase tracking-tight text-sm">Omni AI</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-zinc-500 animate-pulse" />
              <span className="text-[10px] uppercase text-zinc-500 font-semibold tracking-wider hidden sm:block">Core Active</span>
            </div>
            <button onClick={clearHistory} className="text-[10px] text-zinc-400 hover:text-red-500 transition-colors uppercase tracking-widest font-semibold">
              Clear Log
            </button>
          </div>
        </div>

        {/* Terminal Output */}
        <div className="flex-1 overflow-y-auto p-6 text-sm space-y-6 custom-scrollbar bg-white dark:bg-black">
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 mb-1.5 opacity-60">
                {msg.role !== 'user' && <Hash className="w-3 h-3" />}
                <span className="text-[10px] tracking-wider font-mono uppercase text-zinc-500">
                  {msg.role} // {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
                {msg.role === 'user' && <Hash className="w-3 h-3" />}
              </div>
              <div className={`max-w-[85%] md:max-w-[70%] p-3.5 rounded-2xl leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-tr-sm'
                  : msg.role === 'system'
                  ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-mono text-xs rounded-tl-sm'
                  : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2 mb-1.5 opacity-60">
                <Hash className="w-3 h-3" />
                <span className="text-[10px] tracking-wider font-mono uppercase text-zinc-500">AI // PROCESSING</span>
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 p-3.5 rounded-2xl rounded-tl-sm animate-pulse">
                Synthesizing response...
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Terminal Input */}
        <div className="p-4 bg-zinc-50 dark:bg-[#09090b] border-t border-zinc-200 dark:border-zinc-800 z-10">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message Omni AI..."
              autoFocus
              className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-4 pr-12 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors placeholder:text-zinc-400 shadow-sm"
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isTyping}
              className="absolute right-2 p-2 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </Card>
    </motion.div>
  );
};
