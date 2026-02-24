'use client';

import { motion } from 'framer-motion';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
}

export const Card = ({ className = '', children, hover = false, onClick, ...props }: CardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { scale: 1.02, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' } : {}}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};
