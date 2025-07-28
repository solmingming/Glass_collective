import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

const WaterRippleEffect: React.FC = () => {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const rippleId = useRef(0);

  const createRipple = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newRipple: Ripple = {
      id: rippleId.current++,
      x,
      y,
      size: 0,
      opacity: 1
    };
    
    setRipples(prev => [...prev, newRipple]);
    
    // 2초 후 리플 제거
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 2000);
  };

  return (
    <div 
      className="water-ripple-container"
      style={{
        position: 'absolute',
        right: '-200px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(100, 116, 139, 0.1) 0%, rgba(148, 163, 184, 0.05) 50%, transparent 100%)',
        cursor: 'pointer',
        zIndex: 1,
        pointerEvents: 'auto'
      }}
      onClick={createRipple}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 호버 효과 */}
      <motion.div
        className="hover-glow"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(100, 116, 139, 0.3) 0%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none'
        }}
        animate={{
          scale: isHovered ? 1.5 : 1,
          opacity: isHovered ? 0.8 : 0.3
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* 물결 파장들 */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            className="water-ripple"
            style={{
              position: 'absolute',
              left: ripple.x,
              top: ripple.y,
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(100, 116, 139, 0.8) 0%, rgba(148, 163, 184, 0.4) 50%, transparent 100%)',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none'
            }}
            initial={{
              scale: 0,
              opacity: 1
            }}
            animate={{
              scale: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
              opacity: [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0]
            }}
            transition={{
              duration: 2,
              ease: "easeOut",
              times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
            }}
            exit={{ opacity: 0 }}
          />
        ))}
      </AnimatePresence>
      
      {/* 물결 링들 */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={`ring-${ripple.id}`}
            className="water-ring"
            style={{
              position: 'absolute',
              left: ripple.x,
              top: ripple.y,
              width: '2px',
              height: '2px',
              borderRadius: '50%',
              border: '2px solid rgba(100, 116, 139, 0.6)',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none'
            }}
            initial={{
              scale: 0,
              opacity: 1
            }}
            animate={{
              scale: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
              opacity: [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.05, 0.02, 0.01, 0.005, 0.002, 0]
            }}
            transition={{
              duration: 2.5,
              ease: "easeOut",
              times: [0, 0.067, 0.133, 0.2, 0.267, 0.333, 0.4, 0.467, 0.533, 0.6, 0.667, 0.733, 0.8, 0.867, 0.933, 1]
            }}
            exit={{ opacity: 0 }}
          />
        ))}
      </AnimatePresence>
      
      {/* 물방울 효과 */}
      <motion.div
        className="water-drops"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '100%',
          height: '100%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none'
        }}
        animate={{
          scale: isHovered ? 1.1 : 1
        }}
        transition={{ duration: 0.5 }}
      >
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(100, 116, 139, 0.6) 0%, transparent 100%)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
            animate={{
              x: Math.cos(i * Math.PI / 4) * (isHovered ? 80 : 60),
              y: Math.sin(i * Math.PI / 4) * (isHovered ? 80 : 60),
              opacity: isHovered ? 0.8 : 0.3,
              scale: isHovered ? 1.2 : 1
            }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default WaterRippleEffect; 