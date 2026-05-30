import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlobeScene from "./GlobeScene";

import WeddingPortal from './weddingPortal';

export default function WeddingPortalContainer() {
  const [stage, setStage] = useState('globe'); // 'globe' | 'portal'

  return (
    <div className="w-full h-screen bg-[#04120b]">
      <AnimatePresence mode="wait">
        {stage === 'globe' && (
          <motion.div 
            key="globe"
            exit={{ opacity: 0, scale: 1.5, filter: 'blur(20px)' }}
            className="absolute inset-0 z-20"
          >
            {/* When video ends, set stage to 'portal' */}
            <GlobeScene onLanding={() => setStage('portal')} />
          </motion.div>
        )}

        {stage === 'portal' && (
          <motion.div
            key="portal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
          >
            {/* Render your actual WeddingPortal component here */}
            <WeddingPortal /> 
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}