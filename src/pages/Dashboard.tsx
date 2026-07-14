import React from 'react';
import { motion } from 'framer-motion';
import { PomodoroCard } from '../components/Widgets/PomodoroCard';
import { WeatherRadar } from '../components/Widgets/WeatherRadar';
import { AICore } from '../components/Widgets/AICore';
import { HardwareMonitor } from '../components/Widgets/HardwareMonitor';
import { DeviceControl } from '../components/Widgets/DeviceControl';

export const Dashboard: React.FC = () => {
  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.1 }
        }
      }}
    >
      <PomodoroCard />
      <WeatherRadar />
      <HardwareMonitor />
      <AICore className="md:col-span-2 xl:col-span-2" />
      <DeviceControl />
    </motion.div>
  );
};
