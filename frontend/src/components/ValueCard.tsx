import React from 'react';
import { motion } from 'framer-motion';

interface ValueCardProps {
  icon: string;
  title: string;
  description: string;
  delay?: number;
}

const ValueCard: React.FC<ValueCardProps> = ({ 
  icon, 
  title, 
  description, 
  delay = 0 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
    >
      <div className="card">
        <div className="card-header">
          <div className="card-icon">{icon}</div>
          <h3 className="card-title">{title}</h3>
        </div>
        <p className="card-description">{description}</p>
      </div>
    </motion.div>
  );
};

export default ValueCard; 