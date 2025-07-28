import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="hero-section"
    >
      <h1>Hello TypeScript + Motion!</h1>
      <p>Welcome to our amazing application</p>
    </motion.div>
  );
} 