import React from 'react';
import { motion } from 'framer-motion';

interface ObjectImageProps {
  src: string;
  alt: string;
  className?: string;
  delay?: number;
  size?: 'small' | 'medium' | 'large';
}

const ObjectImage: React.FC<ObjectImageProps> = ({
  src,
  alt,
  className = '',
  delay = 0,
  size = 'medium'
}) => {
  const sizeClasses = {
    small: 'w-24 h-24',
    medium: 'w-48 h-60',
    large: 'w-80 h-96'
  };

  return (
    <motion.div
      className={`object-image-container ${sizeClasses[size]} ${className}`}
      initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{
        duration: 0.8,
        delay: delay,
        ease: "easeOut"
      }}
      whileHover={{
        scale: 1.05,
        rotate: 5,
        transition: { duration: 0.3 }
      }}
    >
      <div className="card p-0 overflow-hidden">
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.log('Image failed to load:', src);
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
    </motion.div>
  );
};

export default ObjectImage; 