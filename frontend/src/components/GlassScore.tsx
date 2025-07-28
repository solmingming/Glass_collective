import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface GlassScoreProps {
  score: number;
}

const GlassScore: React.FC<GlassScoreProps> = ({ score }) => {
  const [currentScore, setCurrentScore] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const currentScoreRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, margin: '-20% 0px' });

  // 점수 애니메이션 (inView일 때만, 한 번만 실행)
  useEffect(() => {
    if (!inView || hasAnimated) return;
    
    setHasAnimated(true);
    setCurrentScore(0);
    currentScoreRef.current = 0;
    
    // 점수를 0에서 목표 점수까지 1씩 증가
    const animateScore = () => {
      const targetScore = score;
      let currentValue = 0;
      
      const updateScore = () => {
        if (currentValue < targetScore) {
          currentValue += 1;
          setCurrentScore(currentValue);
          currentScoreRef.current = currentValue;
          
          // 1씩 증가하는 속도 조절 (약 25ms 간격)
          setTimeout(updateScore, 25);
        }
      };
      
      updateScore();
    };
    
    animateScore();
  }, [score, inView, hasAnimated]);

  // 점수에 따른 물 색상 결정 (밝은 민트 + 투명 백색 톤)
  const getWaterColors = (score: number) => {
    if (score >= 90) {
      return {
        primary: 'rgba(147, 197, 253, 0.6)',    // 맑은 하늘색
        secondary: 'rgba(191, 219, 254, 0.4)',  // 연한 하늘색
        accent: 'rgba(255, 255, 255, 0.3)',     // 투명 백색
        glow: 'rgba(147, 197, 253, 0.2)'        // 미묘한 글로우
      };
    } else if (score >= 80) {
      return {
        primary: 'rgba(129, 140, 248, 0.6)',    // 맑은 인디고
        secondary: 'rgba(165, 180, 252, 0.4)',  // 연한 인디고
        accent: 'rgba(255, 255, 255, 0.3)',     // 투명 백색
        glow: 'rgba(129, 140, 248, 0.2)'        // 미묘한 글로우
      };
    } else if (score >= 70) {
      return {
        primary: 'rgba(96, 165, 250, 0.6)',     // 맑은 블루
        secondary: 'rgba(147, 197, 253, 0.4)',  // 연한 블루
        accent: 'rgba(255, 255, 255, 0.3)',     // 투명 백색
        glow: 'rgba(96, 165, 250, 0.2)'         // 미묘한 글로우
      };
    } else if (score >= 60) {
      return {
        primary: 'rgba(79, 140, 255, 0.6)',     // 맑은 로얄블루
        secondary: 'rgba(129, 140, 248, 0.4)',  // 연한 로얄블루
        accent: 'rgba(255, 255, 255, 0.3)',     // 투명 백색
        glow: 'rgba(79, 140, 255, 0.2)'         // 미묘한 글로우
      };
    } else {
      return {
        primary: 'rgba(59, 130, 246, 0.6)',     // 맑은 네이비
        secondary: 'rgba(96, 165, 250, 0.4)',   // 연한 네이비
        accent: 'rgba(255, 255, 255, 0.3)',     // 투명 백색
        glow: 'rgba(59, 130, 246, 0.2)'         // 미묘한 글로우
      };
    }
  };

  const colors = getWaterColors(currentScore);

  // Canvas 물결 애니메이션 (currentScoreRef를 항상 참조)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Canvas 크기 설정
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.setTransform(1, 0, 0, 1, 0, 0); // scale 중복 방지
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    // 물결 애니메이션 변수
    let time = 0;
    const waveSpeed = 0.02;
    const waveAmplitude = 8;
    const waveFrequency = 0.8;
    // 물결 그리기 함수
    const drawWave = () => {
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;
      ctx.clearRect(0, 0, width, height);
      // 최신 점수 기준으로 물 높이 계산
      const waterHeight = (currentScoreRef.current / 100) * 100;
      const waterLevel = height - (height * waterHeight / 100);
      // 메인 물결
      ctx.beginPath();
      ctx.moveTo(0, waterLevel);
      for (let x = 0; x <= width; x += 2) {
        const wave1 = Math.sin(x * waveFrequency * 0.01 + time) * waveAmplitude;
        const wave2 = Math.sin(x * waveFrequency * 0.015 + time * 1.5) * (waveAmplitude * 0.6);
        const wave3 = Math.sin(x * waveFrequency * 0.02 + time * 0.8) * (waveAmplitude * 0.3);
        const y = waterLevel + wave1 + wave2 + wave3;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      const gradient = ctx.createLinearGradient(0, waterLevel, 0, height);
      gradient.addColorStop(0, colors.primary);
      gradient.addColorStop(0.3, colors.accent);
      gradient.addColorStop(0.7, colors.secondary);
      gradient.addColorStop(1, colors.secondary);
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.strokeStyle = colors.glow;
      ctx.lineWidth = 1;
      ctx.stroke();
      // 보조 물결
      ctx.beginPath();
      ctx.moveTo(0, waterLevel);
      for (let x = 0; x <= width; x += 2) {
        const wave1 = Math.sin(x * waveFrequency * 0.008 + time * 0.7) * (waveAmplitude * 0.4);
        const wave2 = Math.sin(x * waveFrequency * 0.012 + time * 1.2) * (waveAmplitude * 0.2);
        const y = waterLevel + wave1 + wave2;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fillStyle = colors.glow;
      ctx.globalAlpha = 0.3;
      ctx.fill();
      ctx.globalAlpha = 1;
      time += waveSpeed;
      animationRef.current = requestAnimationFrame(drawWave);
    };
    drawWave();
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [colors]);

  return (
    <motion.div
      className="glass-score-container"
      ref={containerRef}
      initial={{ opacity: 0, y: 40, scale: 0.96, filter: 'blur(12px)' }}
      whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
      viewport={{ once: true, amount: 0.5 }}
    >
      {/* Glass Container */}
      <div className={`glass-vessel ${currentScore >= 90 ? 'glow-effect' : ''}`}>
        {/* Canvas Water Wave Container */}
        <div className="wave-wrapper">
          <canvas
            ref={canvasRef}
            className="wave-canvas"
            style={{
              width: '100%',
              height: '100%',
              display: 'block'
            }}
          />
        </div>

        {/* Score Text - 물 위에 떠있는 듯한 애니메이션 */}
        <motion.div 
          className="score-display"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 2.5 }}
        >
          <motion.div 
            className="score-number"
            initial={{ scale: 0.8 }}
            animate={{ 
              scale: 1,
              y: [0, -2, 0, 2, 0],
              rotate: [0, 0.5, 0, -0.5, 0]
            }}
            transition={{ 
              duration: 1, 
              delay: 3,
              y: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              },
              rotate: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
          >
            {currentScore}
          </motion.div>
        </motion.div>

        {/* Glass Border */}
        <div className="glass-border"></div>
      </div>
    </motion.div>
  );
};

export default GlassScore; 