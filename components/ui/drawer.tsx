'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

type DrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export const Drawer = ({ isOpen, onClose, children }: DrawerProps) => {
  // Prevent body scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  // Force rerender of children when drawer is opened
  const [key, setKey] = React.useState(0);
  useEffect(() => {
    if (isOpen) {
      setKey(prev => prev + 1);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div
            className="fixed right-0 top-0 h-full w-[280px] bg-black z-50 overflow-auto border-l border-green-900/30 shadow-xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{ backgroundColor: '#000000', boxShadow: '0 0 15px rgba(20, 83, 45, 0.25)' }}
          >
            <div className="flex flex-col h-full">
              <div className="flex justify-end p-4">
                <button 
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-800 transition-colors"
                >
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>
              <div className="flex-1 px-4 py-2" key={key}>
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}; 