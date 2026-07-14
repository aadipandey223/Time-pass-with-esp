import React, { useState, useEffect } from 'react';
import { useMQTT } from '../../context/MQTTContext';
import { motion } from 'framer-motion';
import { Shield, Lock, Wifi, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface AuthOverlayProps {
  children: React.ReactNode;
}

export const AuthOverlay: React.FC<AuthOverlayProps> = ({ children }) => {
  const { status, publish, lastMessage } = useMQTT();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [espOnline, setEspOnline] = useState(false);
  const [loading, setLoading] = useState(false);

  // Parse incoming MQTT messages for auth
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.topic === 'myhome/smarthub_xyz/status') {
      try {
        const data = JSON.parse(lastMessage.payload);
        if (data.status === 'online') {
          setEspOnline(true);
        } else if (data.status === 'offline') {
          setEspOnline(false);
        }
      } catch (e) {
        // Fallback for simple string payloads
        if (lastMessage.payload === 'online') setEspOnline(true);
        if (lastMessage.payload === 'offline') setEspOnline(false);
      }
    }

    if (lastMessage.topic === 'myhome/smarthub_xyz/auth_status') {
      try {
        const data = JSON.parse(lastMessage.payload);
        if (data.status === 'success') {
          setIsAuthenticated(true);
          toast.success('ESP Pairing Successful');
        } else if (data.status === 'error') {
          setLoading(false);
          setPin('');
          toast.error('Invalid Secret Key');
        }
      } catch (e) {}
    }
  }, [lastMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) return;
    setLoading(true);
    publish('myhome/smarthub_xyz/auth', JSON.stringify({ pin }));
    
    // Timeout in case ESP doesn't reply
    setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          toast.error('ESP not responding. Try again.');
          return false;
        }
        return prev;
      });
    }, 5000);
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 bg-zinc-50 dark:bg-[#09090b] flex flex-col items-center justify-center p-6 z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-zinc-900 dark:text-zinc-50" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Secure Pairing</h1>
          <p className="text-zinc-500 text-center text-sm mt-2">
            This dashboard is locked. You must pair with your ESP Smart Hub to continue.
          </p>
        </div>

        {status !== 'connected' ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
            <p className="text-sm text-yellow-800 dark:text-yellow-400 font-medium">
              Connecting to MQTT Broker...
            </p>
          </div>
        ) : !espOnline ? (
          <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 flex flex-col items-center justify-center gap-3 py-8">
            <Wifi className="w-6 h-6 text-zinc-400 animate-pulse" />
            <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium text-center">
              Waiting for ESP to come online...<br/>
              <span className="text-xs text-zinc-500">Please turn on your device.</span>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-zinc-500 mb-2">
                Secret Key (Displayed on ESP)
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.toUpperCase())}
                  placeholder="Enter 4-6 digit code"
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg py-3 pl-10 pr-4 text-lg font-mono text-center tracking-widest text-zinc-900 dark:text-zinc-50 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors placeholder:tracking-normal placeholder:text-zinc-400"
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="w-full bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-medium rounded-lg py-3 flex items-center justify-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
              ) : (
                'Unlock Dashboard'
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
