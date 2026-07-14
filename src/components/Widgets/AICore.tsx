import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../Layout/Card';
import { Terminal, Send, Power } from 'lucide-react';
import { useMQTT } from '@/context/MQTTContext';
import { supabase } from '@/lib/supabase';
import { queryAI } from '@/lib/engines/ai-engine';
import type { AIConfig } from '@/lib/engines/ai-engine';
import { getGPSLocation } from '@/lib/engines/gps-service';
import toast from 'react-hot-toast';

export const AICore = ({ className }: { className?: string }) => {
  const { publish } = useMQTT();
  const [messages, setMessages] = useState<{ role: 'ai'|'user', content: string }[]>([
    { role: 'ai', content: 'AI Core initialized. Connecting to database...' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [configs, setConfigs] = useState<AIConfig[]>([]);

  useEffect(() => {
    const initAI = async () => {
      const { data } = await supabase.from('user_settings').select('ai_configs').limit(1).maybeSingle();
      if (data?.ai_configs) {
        setConfigs(data.ai_configs as AIConfig[]);
        setMessages(prev => [...prev, { role: 'ai', content: `Loaded ${data.ai_configs.length} AI configurations. System ready.` }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: `No AI configurations found in settings. Please add an API key.` }]);
      }
    };
    initAI();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !aiEnabled) return;

    if (configs.length === 0) {
      toast.error('No AI keys configured in Settings!');
      return;
    }

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const { data: deviceState } = await supabase.from('device_state').select('*').limit(1).maybeSingle();
      
      let locationContext = '';
      try {
        const coords = await getGPSLocation();
        locationContext = `User Location: Lat ${coords.lat}, Lon ${coords.lon}.`;
      } catch (e) {
        locationContext = 'User Location: Unknown (GPS denied/unavailable).';
      }

      const systemPrompt = `You are the Omni Smart Hub AI. Keep your answers concise, professional, and helpful.
Context:
- Current Hub Brightness: ${deviceState?.brightness ?? 'Unknown'}
- ${locationContext}
Respond to the user's command appropriately.`;

      const aiResponse = await queryAI(configs, systemPrompt, userMsg);
      
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);

      publish('myhome/smarthub_xyz/cmd', JSON.stringify({ action: 'ai_response', text: aiResponse.substring(0, 50) }));

    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', content: `[ERROR] Connection to AI Providers failed: ${err.message}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleHardware = () => {
    setAiEnabled(!aiEnabled);
    publish('myhome/smarthub_xyz/cmd', JSON.stringify({ action: 'set_mode', mode: !aiEnabled ? 'ai_face' : 'standby' }));
  };

  return (
    <Card className={`flex flex-col min-h-[320px] ${className}`}>
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-zinc-200 dark:border-zinc-800 z-10">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-zinc-900 dark:text-zinc-50" />
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 uppercase tracking-tight text-sm">AI Core Terminal</h3>
        </div>
        <button 
          onClick={toggleHardware}
          className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 border transition-all ${
            aiEnabled 
              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100' 
              : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          <Power className="w-3 h-3" />
          {aiEnabled ? 'Hardware Engaged' : 'Engage Hardware'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 mb-4 z-10 relative pr-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
              msg.role === 'user' 
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-tr-sm' 
                : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-zinc-500 animate-pulse">
              Typing...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="relative z-10 mt-auto">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!aiEnabled}
          placeholder={aiEnabled ? "Message AI Core..." : "Engage AI Core to start chatting"}
          className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors placeholder:text-zinc-400 text-zinc-900 dark:text-zinc-100 disabled:opacity-50"
        />
        <button 
          type="submit" 
          disabled={!aiEnabled || !input.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-50 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </Card>
  );
};
