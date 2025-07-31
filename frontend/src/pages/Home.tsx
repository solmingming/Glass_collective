import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Navigation from '../components/Navigation';
import ValueCard from '../components/ValueCard';
import FeatureCard from '../components/FeatureCard';
import GlassScore from '../components/GlassScore';
import ObjectImage from '../components/ObjectImage';
import ScrollSnap from '../components/ScrollSnap';
import { useNavigate } from 'react-router-dom';

// Import SVG files
import object1Main from '../assets/images/object1/object1.svg';
import object2Main from '../assets/images/object2/object2.svg';

const Home: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [glassKey, setGlassKey] = useState(0);
  const navigate = useNavigate();

  // Define sections for scroll snap
  const sections = ['hero', 'philosophy', 'about', 'features', 'values', 'gallery', 'score', 'cta'];

  // Intersection observers for each section
  const [heroRef, heroInView] = useInView({
    threshold: 0.3,
    triggerOnce: false
  });

  const [philosophyRef, philosophyInView] = useInView({
    threshold: 0.2,
    triggerOnce: false
  });

  const [aboutRef, aboutInView] = useInView({
    threshold: 0.2,
    triggerOnce: false
  });

  const [valuesRef, valuesInView] = useInView({
    threshold: 0.2,
    triggerOnce: false
  });

  const [featuresRef, featuresInView] = useInView({
    threshold: 0.2,
    triggerOnce: false
  });

  const [galleryRef, galleryInView] = useInView({
    threshold: 0.2,
    triggerOnce: false
  });

  const [scoreRef, scoreInView] = useInView({
    threshold: 0.2,
    triggerOnce: false
  });

  const [ctaRef, ctaInView] = useInView({
    threshold: 0.2,
    triggerOnce: false
  });

  const sectionRefs: Record<string, any> = {
    hero: heroRef,
    philosophy: philosophyRef,
    about: aboutRef,
    features: featuresRef,
    values: valuesRef,
    gallery: galleryRef,
    score: scoreRef,
    cta: ctaRef,
  };

  const scrollSnapRef = useRef<any>(null);


  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const threshold = 100;
      
      if (scrollPosition > threshold) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update active section based on which section is in view
  useEffect(() => {
    if (ctaInView) setActiveSection('cta');
    else if (scoreInView) setActiveSection('score');
    else if (galleryInView) setActiveSection('gallery');
    else if (valuesInView) setActiveSection('values');
    else if (featuresInView) setActiveSection('features');
    else if (aboutInView) setActiveSection('about');
    else if (philosophyInView) setActiveSection('philosophy');
    else if (heroInView) setActiveSection('hero');
  }, [heroInView, philosophyInView, aboutInView, featuresInView, valuesInView, galleryInView, scoreInView, ctaInView]);

  // Handle section change from ScrollSnap
  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
  };

  // Smooth scroll to section function
  const scrollToSection = (sectionId: string) => {
    const ref = sectionRefs[sectionId];
    if (ref && ref.current) {
      ref.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      // 스크롤 후 강제로 progress 업데이트
      setTimeout(() => {
        // 스크롤 위치로부터 progress를 직접 계산해서 setScrollProgress 호출
        const scrollPosition = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollableHeight = documentHeight - windowHeight;
        const progress = scrollableHeight > 0 ? (scrollPosition / scrollableHeight) * 100 : 0;
        setScrollProgress(Math.min(progress, 100));
      }, 700); // 스크롤 애니메이션 시간에 맞춰 조정
    }
  };

  useEffect(() => {
    if (heroInView) {
      setGlassKey(prev => prev + 1);
    }
  }, [heroInView]);

    return (
    <>
      {/* Scroll Progress Indicator */}
      <motion.div 
        className="scroll-progress-container"
        initial={{ opacity: 0, y: -20 }}
        animate={{ 
          opacity: 1, 
          y: 0 
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
      </motion.div>

              <ScrollSnap
          sections={sections}
          onSectionChange={handleSectionChange}
          onScrollProgress={setScrollProgress}
          snapThreshold={0.1}
          scrollDelay={200}
        >
        <div className="glass-collective-app">
          <Navigation activeSection={activeSection} />
          
          {/* Hero Section */}
          <section 
            id="hero" 
            ref={heroRef}
            className={`hero-section ${activeSection === 'hero' ? 'active' : ''}`}
            style={{ position: 'relative' }}
          >
            {/* Glass Objects: key를 glassKey로 지정 */}
            <div
              className="glass-objects"
              style={{
                opacity: heroInView ? 1 : 0,
                pointerEvents: heroInView ? 'auto' : 'none',
                transition: 'opacity 0.1s',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
              }}
              key={glassKey}
            >
              <motion.div 
                className="glass-object top-left"
                initial={{ opacity: 0, scale: 0.8, rotate: -15, x: -100, y: -50 }}
                animate={{ opacity: 1, scale: 1, rotate: 0, x: 0, y: 0 }}
                transition={{ 
                  duration: 1.8, 
                  ease: "easeOut",
                  type: "spring",
                  stiffness: 80,
                  damping: 15
                }}
                whileHover={{ 
                  scale: 1.08, 
                  rotate: 8,
                  transition: { duration: 0.4, ease: "easeOut" }
                }}
              >
                <img 
                  src={object1Main} 
                  alt="Glass Object 1" 
                  className="glass-image"
                />
              </motion.div>
              <motion.div 
                className="glass-object bottom-right"
                initial={{ opacity: 0, scale: 0.8, rotate: 15, x: 100, y: 50 }}
                animate={{ opacity: 1, scale: 1, rotate: 0, x: 0, y: 0 }}
                transition={{ 
                  duration: 1.8, 
                  delay: 0.4,
                  ease: "easeOut",
                  type: "spring",
                  stiffness: 80,
                  damping: 15
                }}
                whileHover={{ 
                  scale: 1.08, 
                  rotate: -8,
                  transition: { duration: 0.4, ease: "easeOut" }
                }}
              >
                <img 
                  src={object2Main} 
                  alt="Glass Object 2" 
                  className="glass-image"
                />
              </motion.div>
            </div>
            <div className="hero-content">
              <motion.h1 
                className="hero-title"
                initial={{ opacity: 0, y: 60, scale: 0.85 }}
                animate={{ 
                  opacity: heroInView ? 1 : 0, 
                  y: heroInView ? 0 : 60, 
                  scale: heroInView ? 1 : 0.85 
                }}
                transition={{ 
                  duration: 1.5, 
                  delay: 0.3, 
                  ease: "easeOut",
                  type: "spring",
                  stiffness: 100,
                  damping: 20
                }}
              >
                Glass Collective
              </motion.h1>
              
              <motion.p 
                className="hero-subtitle"
                initial={{ opacity: 0, y: 40 }}
                animate={{ 
                  opacity: heroInView ? 1 : 0, 
                  y: heroInView ? 0 : 40 
                }}
                transition={{ 
                  duration: 1.2, 
                  delay: 0.8, 
                  ease: "easeOut" 
                }}
              >
                구조로 신뢰를 증명하는 무결성
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ 
                  opacity: heroInView ? 1 : 0, 
                  y: heroInView ? 0 : 30 
                }}
                transition={{ 
                  duration: 1, 
                  delay: 1.2, 
                  ease: "easeOut" 
                }}
                className="hero-buttons"
              >
                <button 
                  className="btn btn-primary"
                  onClick={() => scrollSnapRef.current?.scrollToSection('cta', sections.indexOf('cta'))}
                >
                  시작하기
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => scrollSnapRef.current?.scrollToSection('philosophy', sections.indexOf('philosophy'))}
                >
                  더 알아보기
                </button>
              </motion.div>
            </div>
          </section>

          {/* Philosophy Section */}
          <section 
            id="philosophy" 
            ref={philosophyRef}
            className={`section ${activeSection === 'philosophy' ? 'active' : ''}`}
            style={{ background: 'var(--glass-gray-50)' }}
          >
            <div className="container">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ 
                  opacity: philosophyInView ? 1 : 0, 
                  y: philosophyInView ? 0 : 30 
                }}
                transition={{ duration: 0.8 }}
                className="text-center mb-2xl"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: philosophyInView ? 1 : 0, 
                    y: philosophyInView ? 0 : 20 
                  }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="philosophy-text"
                >
                  <div className="slogan">
                    <p className="philosophy-line">신뢰는 쉽게 무너지고,</p>
                    <p className="philosophy-line">기억은 흐릿해지고,</p>
                    <p className="philosophy-line">말은 달라지죠.</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: philosophyInView ? 1 : 0, 
                    y: philosophyInView ? 0 : 20 
                  }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="philosophy-text mt-2xl"
                >
                  <div className="subcopy">
                    <p className="philosophy-line emphasis">우리는 '사람'을 믿는 구조가 아니라,<br />"보이는 구조"만들고 싶었습니다.</p>
                    <p className="philosophy-line">정산, 투표, 결정이 누구에게나 투명하게 보이도록.</p>
                    <p className="philosophy-line final">그게, 진짜 신뢰죠.</p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* About Section */}
          <section 
            id="about" 
            ref={aboutRef}
            className={`section ${activeSection === 'about' ? 'active' : ''}`}
          >
            <div className="container">
              {/* 섹션 타이틀 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ 
                  opacity: aboutInView ? 1 : 0, 
                  y: aboutInView ? 0 : 30 
                }}
                transition={{ duration: 0.8 }}
                className="text-center mb-2xl"
              >
                <h2 className="about-title">신뢰가 보이는 공동체 시스템</h2>
              </motion.div>

              {/* 서브카피 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ 
                  opacity: aboutInView ? 1 : 0, 
                  y: aboutInView ? 0 : 30 
                }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-center mb-3xl"
              >
                <div className="about-subcopy">
                  <p>정산, 투표, 규칙을</p>
                  <p>누구나 확인하고, 누구도 조작할 수 없게 만드는 시스템이에요.</p>
                  <br />
                  <p className="about-highlight">신뢰를 사람에게서 구조로 옮긴 거예요.</p>
                </div>
              </motion.div>

              {/* 핵심 기능 3박스 */}
              <motion.div 
                className="grid grid-3"
                initial={{ opacity: 0, y: 50 }}
                animate={{ 
                  opacity: aboutInView ? 1 : 0, 
                  y: aboutInView ? 0 : 50 
                }}
                transition={{ duration: 1, delay: 0.4 }}
              >
                <motion.div 
                  className="about-card"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: aboutInView ? 1 : 0, 
                    scale: aboutInView ? 1 : 0.8 
                  }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <div className="about-card-icon">
                    🔍
                  </div>
                  <h3 className="about-card-title">Transparent Traceability</h3>
                  <p className="about-card-description">
                    모든 기록이 투명하게 남고<br />
                    누구나 실시간으로 확인해요.
                  </p>
                  <small className="about-card-example">
                    예: 회비 사용 내역
                  </small>
                </motion.div>

                <motion.div 
                  className="about-card"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: aboutInView ? 1 : 0, 
                    scale: aboutInView ? 1 : 0.8 
                  }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <div className="about-card-icon">
                    🔒
                  </div>
                  <h3 className="about-card-title">Immutable Rules</h3>
                  <p className="about-card-description">
                    한 번 정한 규칙은<br />
                    누구도 바꿀 수 없어요.
                  </p>
                  <small className="about-card-example">
                    예: 정산 기준
                  </small>
                </motion.div>

                <motion.div 
                  className="about-card"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: aboutInView ? 1 : 0, 
                    scale: aboutInView ? 1 : 0.8 
                  }}
                  transition={{ duration: 0.6, delay: 0.9 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <div className="about-card-icon">
                    🧠
                  </div>
                  <h3 className="about-card-title">Collective Intelligence</h3>
                  <p className="about-card-description">
                    누구든 제안하고,<br />
                    과반 동의되면 자동 실행돼요.
                  </p>
                  <small className="about-card-example">
                    예: 회식비 사용 제안
                  </small>
                </motion.div>
              </motion.div>

              {/* 마무리 한 줄 */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ 
                  opacity: aboutInView ? 1 : 0, 
                  y: aboutInView ? 0 : 30 
                }}
                transition={{ duration: 0.8, delay: 1.2 }}
                className="text-center mt-3xl"
              >
                <p className="about-conclusion">
                  신뢰할 필요 없는 구조로<br />
                  믿을 수 있는 공동체를 만듭니다.
                </p>
              </motion.div>
            </div>
          </section>

          {/* Features Section */}
          <section 
            id="features" 
            ref={featuresRef}
            className={`section ${activeSection === 'features' ? 'active' : ''}`}
          >
            <div className="container">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ 
                  opacity: featuresInView ? 1 : 0, 
                  y: featuresInView ? 0 : 30 
                }}
                transition={{ duration: 0.8 }}
                className="text-center mb-2xl"
              >
                <h2>How It Works</h2>
                <p className="max-w-2xl mx-auto">
                  투명하고 신뢰할 수 있는<br />
                  의사결정 과정
                </p>
              </motion.div>

              <motion.div 
                className="grid grid-3"
                initial={{ opacity: 0, y: 50 }}
                animate={{ 
                  opacity: featuresInView ? 1 : 0, 
                  y: featuresInView ? 0 : 50 
                }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ 
                    opacity: featuresInView ? 1 : 0, 
                    y: featuresInView ? 0 : 30 
                  }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <FeatureCard
                    icon="📋"
                    title="Proposal"
                    description="투명한 제안 시스템"
                    delay={0.1}
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ 
                    opacity: featuresInView ? 1 : 0, 
                    y: featuresInView ? 0 : 30 
                  }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <FeatureCard
                    icon="🗳️"
                    title="Voting"
                    description="공정한 투표 시스템"
                    delay={0.2}
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ 
                    opacity: featuresInView ? 1 : 0, 
                    y: featuresInView ? 0 : 30 
                  }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <FeatureCard
                    icon="⚡"
                    title="Execution"
                    description="자동 실행 시스템"
                    delay={0.3}
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ 
                    opacity: featuresInView ? 1 : 0, 
                    y: featuresInView ? 0 : 30 
                  }}
                  transition={{ duration: 0.6, delay: 1.0 }}
                >
                  <FeatureCard
                    icon="📊"
                    title="Monitoring"
                    description="실시간 모니터링"
                    delay={0.4}
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ 
                    opacity: featuresInView ? 1 : 0, 
                    y: featuresInView ? 0 : 30 
                  }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                >
                  <FeatureCard
                    icon="🔒"
                    title="Security"
                    description="보안 및 신뢰성"
                    delay={0.5}
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ 
                    opacity: featuresInView ? 1 : 0, 
                    y: featuresInView ? 0 : 30 
                  }}
                  transition={{ duration: 0.6, delay: 1.4 }}
                >
                  <FeatureCard
                    icon="🌐"
                    title="Transparency"
                    description="완전한 투명성"
                    delay={0.6}
                  />
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* Values Section */}
          <section 
            id="values" 
            ref={valuesRef}
            className={`section ${activeSection === 'values' ? 'active' : ''}`}
            style={{ background: 'var(--glass-gray-50)' }}
          >
            <div className="container">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ 
                  opacity: valuesInView ? 1 : 0, 
                  y: valuesInView ? 0 : 30 
                }}
                transition={{ duration: 0.8 }}
                className="text-center mb-2xl"
              >
                <h2>Our Values</h2>
                <p className="max-w-2xl mx-auto">
                  우리가 추구하는 핵심 가치들
                </p>
              </motion.div>

              <motion.div 
                className="grid grid-4"
                initial={{ opacity: 0, y: 50 }}
                animate={{ 
                  opacity: valuesInView ? 1 : 0, 
                  y: valuesInView ? 0 : 50 
                }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ 
                    opacity: valuesInView ? 1 : 0, 
                    y: valuesInView ? 0 : 30 
                  }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <ValueCard
                    icon="🔍"
                    title="Transparency"
                    description="We pursue complete transparency where all processes are public and verifiable."
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ 
                    opacity: valuesInView ? 1 : 0, 
                    y: valuesInView ? 0 : 30 
                  }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <ValueCard
                    icon="⚖️"
                    title="Fairness"
                    description="We provide equal rights and opportunities to all members."
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ 
                    opacity: valuesInView ? 1 : 0, 
                    y: valuesInView ? 0 : 30 
                  }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <ValueCard
                    icon="🛡️"
                    title="Integrity"
                    description="We ensure trust through unchangeable rules."
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ 
                    opacity: valuesInView ? 1 : 0, 
                    y: valuesInView ? 0 : 30 
                  }}
                  transition={{ duration: 0.6, delay: 1.0 }}
                >
                  <ValueCard
                    icon="🌱"
                    title="Sustainability"
                    description="We pursue sustainable growth of the community from a long-term perspective."
                  />
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* Glass Objects Gallery */}
          <section 
            id="gallery" 
            ref={galleryRef}
            className={`section ${activeSection === 'gallery' ? 'active' : ''}`}
            style={{ background: 'var(--glass-gray-50)' }}
          >
            <div className="container">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ 
                  opacity: galleryInView ? 1 : 0, 
                  y: galleryInView ? 0 : 30 
                }}
                transition={{ duration: 0.8 }}
                className="text-center mb-2xl"
              >
                <h2>Glass Objects</h2>
                <p className="max-w-2xl mx-auto">
                  Glass objects symbolizing transparency and immutability<br />
                  Each expressing our core values.
                </p>
              </motion.div>

              <motion.div 
                className="grid grid-4"
                initial={{ opacity: 0, y: 50 }}
                animate={{ 
                  opacity: galleryInView ? 1 : 0, 
                  y: galleryInView ? 0 : 50 
                }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: galleryInView ? 1 : 0, 
                    scale: galleryInView ? 1 : 0.8 
                  }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <ObjectImage 
                    src={object1Main} 
                    alt="Glass Object 1" 
                    size="medium"
                    delay={0.1}
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: galleryInView ? 1 : 0, 
                    scale: galleryInView ? 1 : 0.8 
                  }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <ObjectImage 
                    src={object2Main} 
                    alt="Glass Object 2" 
                    size="medium"
                    delay={0.2}
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: galleryInView ? 1 : 0, 
                    scale: galleryInView ? 1 : 0.8 
                  }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <ObjectImage 
                    src={object1Main} 
                    alt="Glass Object 3" 
                    size="medium"
                    delay={0.3}
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: galleryInView ? 1 : 0, 
                    scale: galleryInView ? 1 : 0.8 
                  }}
                  transition={{ duration: 0.6, delay: 1.0 }}
                >
                  <ObjectImage 
                    src={object2Main} 
                    alt="Glass Object 4" 
                    size="medium"
                    delay={0.4}
                  />
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* Glass Score & Corruption Index Section */}
          <section 
            id="score" 
            ref={scoreRef}
            className={`section ${activeSection === 'score' ? 'active' : ''}`}
          >
            <div className="container">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ 
                  opacity: scoreInView ? 1 : 0, 
                  y: scoreInView ? 0 : 30 
                }}
                transition={{ duration: 0.8 }}
                className="text-center mb-2xl"
              >
                <h2>Glass Score & Corruption Index</h2>
                <p className="max-w-2xl mx-auto">
                  투명성과 신뢰의 지표와<br />
                  시스템 위험 요소를 한눈에 모니터링합니다.
                </p>
              </motion.div>

              {/* Main Glass Score */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ 
                  opacity: scoreInView ? 1 : 0, 
                  scale: scoreInView ? 1 : 0.95 
                }}
                transition={{ duration: 1, delay: 0.2 }}
                className="flex justify-center mb-2xl"
              >
                <GlassScore score={78} />
              </motion.div>

              {/* Metrics Grid - 2 rows */}
              <motion.div 
                className="metrics-container"
                initial={{ opacity: 0, y: 50 }}
                animate={{ 
                  opacity: scoreInView ? 1 : 0, 
                  y: scoreInView ? 0 : 50 
                }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                {/* Minimal Metrics Section */}
                <div className="metrics-section">
                  <h3 className="metrics-section-title">핵심 지표</h3>
                  <div className="grid grid-3">
                    {/* Trust */}
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ 
                        opacity: scoreInView ? 1 : 0, 
                        y: scoreInView ? 0 : 30 
                      }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    >
                      <div className="metric-card positive excellent">
                        <div className="metric-icon">🔒</div>
                        <h3 className="metric-title">Trust</h3>
                        <div className="metric-bar">
                          <motion.div 
                            className="metric-fill excellent"
                            initial={{ width: 0 }}
                            animate={{ 
                              width: scoreInView ? "95%" : 0 
                            }}
                            transition={{ duration: 1.5, delay: 0.5 }}
                          ></motion.div>
                        </div>
                        <div className="metric-value">95%</div>
                        <div className="metric-status excellent">우수</div>
                      </div>
                    </motion.div>

                    {/* Transparency */}
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ 
                        opacity: scoreInView ? 1 : 0, 
                        y: scoreInView ? 0 : 30 
                      }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                    >
                      <div className="metric-card positive good">
                        <div className="metric-icon">🔍</div>
                        <h3 className="metric-title">Transparency</h3>
                        <div className="metric-bar">
                          <motion.div 
                            className="metric-fill good"
                            initial={{ width: 0 }}
                            animate={{ 
                              width: scoreInView ? "87%" : 0 
                            }}
                            transition={{ duration: 1.5, delay: 0.7 }}
                          ></motion.div>
                        </div>
                        <div className="metric-value">87%</div>
                        <div className="metric-status good">양호</div>
                      </div>
                    </motion.div>

                    {/* Risk Alert */}
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ 
                        opacity: scoreInView ? 1 : 0, 
                        y: scoreInView ? 0 : 30 
                      }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                    >
                      <div className="metric-card risk warning">
                        <div className="metric-icon">📉</div>
                        <h3 className="metric-title">투표율 저하</h3>
                        <div className="metric-bar">
                          <motion.div 
                            className="metric-fill medium-risk"
                            initial={{ width: 0 }}
                            animate={{ 
                              width: scoreInView ? "35%" : 0 
                            }}
                            transition={{ duration: 1.5, delay: 0.9 }}
                          ></motion.div>
                        </div>
                        <div className="metric-value">35%</div>
                        <div className="metric-status warning">주의</div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Additional Indicators - Tooltip Style */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ 
                  opacity: scoreInView ? 1 : 0, 
                  y: scoreInView ? 0 : 30 
                }}
                transition={{ duration: 0.8, delay: 1.0 }}
                className="additional-indicators"
              >
                
  
              </motion.div>
            </div>
          </section>

          {/* CTA Section */}
          <section 
            id="cta" 
            ref={ctaRef}
            className={`section ${activeSection === 'cta' ? 'active' : ''}`}
          >
            <div className="cta-container">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ 
                  opacity: ctaInView ? 1 : 0, 
                  y: ctaInView ? 0 : 40 
                }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="cta-content"
              >
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: ctaInView ? 1 : 0, 
                    y: ctaInView ? 0 : 20 
                  }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="cta-heading"
                >
                  Join the Glass Collective
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: ctaInView ? 1 : 0, 
                    y: ctaInView ? 0 : 20 
                  }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="cta-subtitle"
                >
                  Let's build a new era of decisions you don't have to trust — because you can see them.
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: ctaInView ? 1 : 0, 
                    y: ctaInView ? 0 : 20 
                  }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="cta-stats"
                >
                  <span className="cta-stat-text">Over 920 members joined this month</span>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: ctaInView ? 1 : 0, 
                    y: ctaInView ? 0 : 20 
                  }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  className="cta-button-container"
                >
                  <motion.button
                    className="cta-button"
                    whileHover={{ 
                      scale: 1.05,
                      transition: { duration: 0.3, ease: "easeOut" }
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => navigate('/login')}
                  >
                    <span className="button-text">Get Started</span>
                    <span className="button-icon">→</span>
                    <div className="button-glow"></div>
                    <div className="button-particles">
                      <div className="particle"></div>
                      <div className="particle"></div>
                      <div className="particle"></div>
                    </div>
                  </motion.button>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: ctaInView ? 1 : 0, 
                    scale: ctaInView ? 1 : 0.8 
                  }}
                  transition={{ duration: 1, delay: 1.0 }}
                  className="cta-signature"
                >
                
                </motion.div>
              </motion.div>
              
              {/* Background Glass Circle */}
              <div className="cta-background-circle"></div>
              
              {/* Floating Glass Elements */}
              <div className="cta-floating-elements">
                <div className="floating-glass"></div>
                <div className="floating-glass"></div>
                <div className="floating-glass"></div>
              </div>
            </div>
          </section>
        </div>
      </ScrollSnap>
    </>
  );
  };

  export default Home; 