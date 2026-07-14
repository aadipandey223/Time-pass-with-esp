import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface GlassPanelProps extends React.ComponentPropsWithoutRef<typeof motion.div> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({ children, className, hoverEffect = true, ...props }) => {
  return (
    <motion.div
      className={cn(
        'glass-panel p-6 relative overflow-hidden',
        hoverEffect && 'glass-panel-hover',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      {...props}
    >
      {/* Subtle shine effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative z-10 h-full">
        {children}
      </div>
    </motion.div>
  );
};
