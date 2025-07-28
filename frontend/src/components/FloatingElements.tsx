import React from 'react';
import { motion } from 'framer-motion';

interface FloatingElementProps {
  size: number;
  delay: number;
  duration: number;
  x: number;
  y: number;
  opacity: number;
  shape: 'circle' | 'organic' | 'blob' | 'crystal';
}

const FloatingElement: React.FC<FloatingElementProps> = ({ 
  size, 
  delay, 
  duration, 
  x, 
  y, 
  opacity,
  shape
}) => {
  const getShapeClass = () => {
    switch (shape) {
      case 'circle': return 'floating-element-circle';
      case 'organic': return 'floating-element-organic';
      case 'blob': return 'floating-element-blob';
      case 'crystal': return 'floating-element-crystal';
      default: return 'floating-element-organic';
    }
  };

  return (
    <motion.div
      className={`floating-element ${getShapeClass()}`}
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: `${y}%`,
        opacity: opacity,
      }}
      animate={{
        y: [0, -40, 0],
        x: [0, 20, 0],
        rotate: [0, 8, -8, 0],
        scale: [1, 1.15, 0.85, 1],
      }}
      transition={{
        duration: duration,
        delay: delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      whileHover={{
        scale: 1.3,
        opacity: 0.8,
        transition: { duration: 0.3 }
      }}
    />
  );
};

const FloatingElements: React.FC = () => {
  const elements = [
    // Organic shapes - main floating elements
    { size: 80, delay: 0, duration: 8, x: 10, y: 20, opacity: 0.3, shape: 'organic' as const },
    { size: 120, delay: 2, duration: 10, x: 85, y: 15, opacity: 0.2, shape: 'organic' as const },
    { size: 60, delay: 4, duration: 12, x: 20, y: 70, opacity: 0.4, shape: 'organic' as const },
    
    // Circle shapes - secondary elements
    { size: 100, delay: 1, duration: 9, x: 75, y: 80, opacity: 0.25, shape: 'circle' as const },
    { size: 70, delay: 3, duration: 11, x: 5, y: 50, opacity: 0.35, shape: 'circle' as const },
    { size: 90, delay: 5, duration: 7, x: 90, y: 40, opacity: 0.3, shape: 'circle' as const },
    
    // Blob shapes - accent elements
    { size: 85, delay: 1.5, duration: 8.5, x: 30, y: 30, opacity: 0.25, shape: 'blob' as const },
    { size: 110, delay: 3.5, duration: 9.5, x: 70, y: 60, opacity: 0.2, shape: 'blob' as const },
    
    // Crystal shapes - highlight elements
    { size: 75, delay: 2.5, duration: 10.5, x: 50, y: 10, opacity: 0.3, shape: 'crystal' as const },
    { size: 95, delay: 4.5, duration: 7.5, x: 15, y: 85, opacity: 0.25, shape: 'crystal' as const },
  ];

  return (
    <div className="floating-elements-container">
      {elements.map((element, index) => (
        <FloatingElement key={index} {...element} />
      ))}
    </div>
  );
};

export default FloatingElements; 