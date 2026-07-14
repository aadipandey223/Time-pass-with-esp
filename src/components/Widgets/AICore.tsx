import React, { useState, useEffect, useRef } from 'react';
import { GlassPanel } from '../Layout/GlassPanel';
import { Terminal, Send, Power } from 'lucide-react';
import { useMQTT } from '@/context/MQTTContext';

export const AICore = ({ className }: { className?: string }) => {
  const { publish } = useMQTT();
  const [messages, setMessages] = useState<{ role: 'ai'|'user', content: string }[]>([
    { role: 'ai', content: 'System initialized. Awaiting input...' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const [aiEnabled, setAiEnabled] = useState(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !aiEnabled) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'ai', content: `Acknowledged command: "${userMsg}". Analyzing system states...` }]);
    }, 1500);
  };

  const toggleHardware = () => {
    setAiEnabled(!aiEnabled);
    publish('myhome/smarthub_xyz/cmd', JSON.stringify({ action: 'set_mode', mode: !aiEnabled ? 'ai_face' : 'standby' }));
  };

  return (
    <GlassPanel className={`flex flex-col min-h-[320px] ${className}`}>
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10 z-10">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-neon-purple" />
          <h3 className="font-semibold text-white/80 uppercase tracking-widest text-sm text-glow">AI Core Terminal</h3>
        </div>
        <button 
          onClick={toggleHardware}
          className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 border transition-all ${
            aiEnabled 
              ? 'bg-neon-purple/20 text-neon-purple border-neon-purple/50 shadow-[0_0_10px_rgba(124,58,237,0.4)]' 
              : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
          }`}
        >
          <Power className="w-3 h-3" />
          {aiEnabled ? 'Hardware Engaged' : 'Engage Hardware'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar space-y-4 mb-4 z-10 relative">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm font-mono ${
              msg.role === 'user' 
                ? 'bg-neon-blue/20 border border-neon-blue/30 text-neon-blue shadow-[0_0_10px_rgba(0,184,255,0.1)]' 
                : 'bg-white/5 border border-white/10 text-white/80'
            }`}>
              {msg.role === 'ai' && <span className="text-neon-purple font-bold mr-2">{'>'}</span>}
              {msg.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-neon-purple animate-pulse">
              {'>'} Processing...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="relative z-10">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!aiEnabled}
          placeholder={aiEnabled ? "Enter command sequence..." : "Engage AI Core to input commands"}
          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm font-mono focus:outline-none focus:border-neon-purple/50 focus:ring-1 focus:ring-neon-purple/50 transition-all placeholder:text-white/30 disabled:opacity-50"
        />
        <button 
          type="submit" 
          disabled={!aiEnabled || !input.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-neon-purple hover:bg-neon-purple/10 disabled:opacity-50 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </GlassPanel>
  );
};
