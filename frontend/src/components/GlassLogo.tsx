import { motion } from 'framer-motion';

export default function GlassLogo() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className="glass-logo"
    >
      <div className="logo-container">
        <div className="logo-icon">
          <div className="glass-shape"></div>
          <div className="collective-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <div className="logo-text">
          <h1>Glass Collective</h1>
          <p>Trust, by design.</p>
        </div>
      </div>
    </motion.div>
  );
} 