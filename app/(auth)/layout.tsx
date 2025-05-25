'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// Animated green background with dots
const AnimatedBackground = () => {
  const [dots, setDots] = useState<{ x: number; y: number; size: number; delay: number }[]>([]);
  
  useEffect(() => {
    // Create random dots for the background
    const newDots = Array.from({ length: 100 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 5 + 1,
      delay: Math.random() * 5,
    }));
    setDots(newDots);
  }, []);

  return (
    <div className="fixed inset-0 z-[-2] overflow-hidden">
      {/* Green gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50/30 to-white dark:from-black dark:via-green-950/20 dark:to-black"></div>
      
      {/* Animated dots */}
      {dots.map((dot, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-green-500/10 dark:bg-green-400/10"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: `${dot.size}px`,
            height: `${dot.size}px`,
          }}
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0.1, 0.5, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 10,
            delay: dot.delay,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
      
      {/* Radial gradient overlay */}
      <div className="absolute z-[-1] pointer-events-none inset-0 flex items-center justify-center [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
    </div>
  );
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-hidden w-full">
      <AnimatedBackground />
      <main className="flex min-h-screen flex-col items-center bg-black justify-between w-full overflow-hidden">
        {children}
      </main>
    </div>
  );
} 