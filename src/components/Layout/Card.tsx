import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface CardProps extends React.ComponentPropsWithoutRef<typeof motion.div> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hoverEffect = true, ...props }) => {
  return (
    <motion.div
      className={cn(
        'bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-6 relative overflow-hidden transition-colors',
        hoverEffect && 'hover:border-zinc-300 dark:hover:border-zinc-700',
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      {...props}
    >
      <div className="relative z-10 h-full">
        {children}
      </div>
    </motion.div>
  );
};
