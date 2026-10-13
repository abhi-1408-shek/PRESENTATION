// ============================================================
// BREACH//REWIND — Cinematic Title Screen
// ============================================================

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, Brain } from 'lucide-react';

interface Props {
  onStart: () => void;
}

export const TitleScreen: React.FC<Props> = ({ onStart }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-void grid-bg"
    >
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyber-cyan/[0.03] blur-[120px]" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-cyber-purple/[0.04] blur-[80px]" />
      </div>

      {/* Neural network animation lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-cyber-cyan/20 to-transparent"
            style={{
              top: `${20 + i * 8}%`,
              left: '-10%',
              width: '120%',
            }}
            animate={{
              opacity: [0, 0.3, 0],
              x: ['-10%', '10%'],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Title content */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="relative text-center z-10"
      >
        {/* Icon cluster */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <Shield className="w-8 h-8 text-cyber-cyan/40" />
          </motion.div>
          <Brain className="w-12 h-12 text-cyber-cyan/60" />
          <motion.div
            animate={{ rotate: [360, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          >
            <Zap className="w-8 h-8 text-cyber-cyan/40" />
          </motion.div>
        </div>

        {/* Main title */}
        <h1 className="font-display text-6xl md:text-7xl lg:text-8xl font-bold tracking-wider mb-2">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan via-cyber-blue to-cyber-purple">
            BREACH
          </span>
          <span className="text-cyber-red mx-2">//</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-purple via-cyber-blue to-cyber-cyan">
            REWIND
          </span>
        </h1>

        {/* Subtitle */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="font-display text-xl md:text-2xl tracking-[0.3em] text-slate-400 mb-6 uppercase"
        >
          Temporal Forensics Lab
        </motion.h2>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="font-mono text-sm text-slate-500 mb-12 italic max-w-md mx-auto"
        >
          "Every event leaves a trace. Every trace changes the state."
        </motion.p>

        {/* Research topic */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="mb-10 glass-panel inline-block px-6 py-3"
        >
          <p className="font-display text-xs tracking-[0.15em] text-cyber-cyan/70 uppercase">
            Spiking Neural Networks for Real-Time Identity Verification
            <br />& Threat Detection
          </p>
        </motion.div>

        {/* Start button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
        >
          <button
            onClick={onStart}
            className="group relative px-10 py-4 rounded-xl font-display text-lg font-semibold tracking-wider text-void bg-gradient-to-r from-cyber-cyan to-cyber-blue hover:from-cyber-cyan hover:to-cyber-purple transition-all duration-500 shadow-cyber-strong hover:shadow-[0_0_40px_rgba(0,242,254,0.4)] active:scale-95"
          >
            START DEMO
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyber-cyan to-cyber-blue opacity-0 group-hover:opacity-20 blur-xl transition-opacity" />
          </button>
        </motion.div>
      </motion.div>

      {/* Bottom attribution */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="absolute bottom-8 text-center"
      >
        <p className="font-mono text-[10px] text-slate-600 tracking-wider">
          SYNTHETIC DEMONSTRATION — ALL ATTACK DATA IS SIMULATED
        </p>
      </motion.div>
    </motion.div>
  );
};
