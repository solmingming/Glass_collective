import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface NavigationProps {
  activeSection?: string;
}

const Navigation: React.FC<NavigationProps> = ({ activeSection = 'hero' }) => {
  const navigate = useNavigate();
  
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <motion.nav
      className="navigation"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="nav-content">
        <motion.div
          className="nav-logo"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
          onClick={() => scrollToSection('hero')}
          style={{ cursor: 'pointer' }}
        >
          <span className="logo-text">Glass Collective</span>
        </motion.div>
        
        <div className="nav-links">
          <motion.a 
            href="#philosophy" 
            className={`nav-link ${activeSection === 'philosophy' ? 'active' : ''}`}
            data-section="philosophy"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('philosophy');
            }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            Philosophy
          </motion.a>
          
          <motion.a 
            href="#about" 
            className={`nav-link ${activeSection === 'about' ? 'active' : ''}`}
            data-section="about"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('about');
            }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            About
          </motion.a>
          
          <motion.a 
            href="#values" 
            className={`nav-link ${activeSection === 'values' ? 'active' : ''}`}
            data-section="values"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('values');
            }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            Values
          </motion.a>
          
          <motion.a 
            href="#features" 
            className={`nav-link ${activeSection === 'features' ? 'active' : ''}`}
            data-section="features"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('features');
            }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            Features
          </motion.a>
          
          <motion.a 
            href="#score" 
            className={`nav-link ${activeSection === 'score' ? 'active' : ''}`}
            data-section="score"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('score');
            }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            Score
          </motion.a>
          

        </div>
        
        <motion.div
          className="nav-actions"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <motion.button
            className="login-button"
            onClick={() => navigate('/login')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            Log in
          </motion.button>
        </motion.div>
      </div>
    </motion.nav>
  );
};

export default Navigation; 