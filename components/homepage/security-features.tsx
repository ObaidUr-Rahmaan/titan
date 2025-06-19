'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Database, 
  ServerCrash, 
  KeyRound, 
  FileJson, 
  Clock
} from 'lucide-react';

interface SecurityFeatureProps {
  icon: React.ReactNode;
  name: string;
  description: string;
  delay: number;
}

function SecurityFeature({ icon, name, description, delay }: SecurityFeatureProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: delay,
        ease: [0.25, 0.4, 0.25, 1],
      }}
      className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border border-green-500/20 bg-gradient-to-br from-green-950/30 to-emerald-900/10 hover:from-green-950/40 hover:to-emerald-900/20 transition-all duration-300"
    >
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-green-400 font-semibold mb-1">{name}</h3>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    </motion.div>
  );
}

export function SecurityFeatures() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  
  const features = [
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      name: "Comprehensive Authentication",
      description: "Secure Clerk integration with webhook signature verification and proper middleware route protection.",
      delay: 0.1,
    },
    {
      icon: <Database className="h-5 w-5" />,
      name: "Row Level Security",
      description: "Optimized RLS policies with proper indexes for all database tables, ensuring users can only access their own data.",
      delay: 0.2,
    },
    {
      icon: <FileJson className="h-5 w-5" />,
      name: "Input Validation",
      description: "Zod schema validation for critical endpoints with type-safe APIs to prevent injection attacks and ensure data integrity.",
      delay: 0.4,
    },
    {
      icon: <Lock className="h-5 w-5" />,
      name: "Content Security Policy",
      description: "Comprehensive CSP headers prevent XSS attacks by controlling which resources can be loaded.",
      delay: 0.5,
    },
    {
      icon: <KeyRound className="h-5 w-5" />,
      name: "CORS Protection",
      description: "API routes are protected with proper CORS headers to prevent unauthorized cross-origin requests.",
      delay: 0.6,
    },
    {
      icon: <Clock className="h-5 w-5" />,
      name: "Dependency Scanning",
      description: "Automatic GitHub Dependabot security scanning ensures your dependencies stay secure and up-to-date.",
      delay: 0.7,
    },
  ];

  return (
    <div ref={ref} className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-black">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: '100px' } : { width: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="h-[1px] bg-gradient-to-r from-transparent via-green-500/50 to-transparent mx-auto mb-8"
          />
          
          <h2 className="text-white text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Enterprise-Grade Security
          </h2>
          <p className="text-gray-400 max-w-3xl mx-auto">
            Titan is built with security as a priority. Every component is audited and implemented with best practices to protect your application and users.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12"
        >
          {features.map((feature) => (
            <SecurityFeature
              key={feature.name}
              icon={feature.icon}
              name={feature.name}
              description={feature.description}
              delay={feature.delay}
            />
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-400 text-sm">
            Security features are regularly updated based on evolving best practices
          </p>
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: '100px' } : { width: 0 }}
            transition={{ duration: 1, delay: 1 }}
            className="h-[1px] bg-gradient-to-r from-transparent via-green-500/50 to-transparent mx-auto mt-8"
          />
        </motion.div>
      </div>
    </div>
  );
} 