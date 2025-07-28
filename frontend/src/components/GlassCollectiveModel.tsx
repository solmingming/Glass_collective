import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface GlassCollectiveModelProps {
  mousePosition: { x: number; y: number };
  isTracking: boolean;
}

const GlassCollectiveModel: React.FC<GlassCollectiveModelProps> = ({ mousePosition, isTracking }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [targetRotation, setTargetRotation] = useState({ x: 0, y: 0 });
  const [currentRotation, setCurrentRotation] = useState({ x: 0, y: 0 });
  const [hoverIntensity, setHoverIntensity] = useState(0);
  
  // 임시로 간단한 구체 사용 (테스트용)
  // const { scene } = useGLTF('/models/glass_collective.glb');

  useEffect(() => {
    if (isTracking) {
      setTargetRotation({
        x: mousePosition.y * 2.5,
        y: mousePosition.x * 2.5
      });
    }
  }, [mousePosition, isTracking]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // 부드러운 회전 애니메이션 (lerp)
      const damping = 0.06;
      currentRotation.x += (targetRotation.x - currentRotation.x) * damping;
      currentRotation.y += (targetRotation.y - currentRotation.y) * damping;
      
      meshRef.current.rotation.x = currentRotation.x;
      meshRef.current.rotation.y = currentRotation.y;
      
      // 자동 회전 (클릭하지 않았을 때)
      if (!isTracking) {
        meshRef.current.rotation.y += delta * 0.8;
        meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
      }
      
      // 호버 효과
      setHoverIntensity(Math.sin(state.clock.elapsedTime * 2) * 0.5 + 0.5);
    }
  });

  return (
    <group>
      {/* 메인 구체 */}
      <mesh ref={meshRef} scale={[1.5, 1.5, 1.5]} position={[0, 0, 0]}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial 
          color={isTracking ? "#3b82f6" : "#64748b"}
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.9}
          emissive={isTracking ? "#1e40af" : "#334155"}
          emissiveIntensity={isTracking ? 0.3 : 0.1}
        />
      </mesh>
      
      {/* 외부 글로우 효과 */}
      <mesh scale={[1.8, 1.8, 1.8]} position={[0, 0, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial 
          color={isTracking ? "#60a5fa" : "#94a3b8"}
          transparent
          opacity={0.1}
        />
      </mesh>
      
      {/* 파티클 효과 */}
      {isTracking && (
        <group>
          {[...Array(20)].map((_, i) => (
            <mesh
              key={i}
              position={[
                Math.sin(i * 0.5) * 2,
                Math.cos(i * 0.3) * 2,
                Math.sin(i * 0.7) * 2
              ]}
              scale={[0.05, 0.05, 0.05]}
            >
              <sphereGeometry args={[1, 8, 8]} />
              <meshBasicMaterial 
                color="#60a5fa"
                transparent
                opacity={0.6}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};

const GlassCollectiveScene: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    console.log('Setting up mouse tracking...');
    
    // 전역 마우스 위치 추적
    const handleMouseMove = (event: MouseEvent) => {
      if (!isTracking) return;
      
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      setMousePosition({ x, y });
    };

    // 이벤트 리스너 추가
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    // 초기 마우스 위치 설정
    const initialX = (window.innerWidth / 2 / window.innerWidth) * 2 - 1;
    const initialY = -(window.innerHeight / 2 / window.innerHeight) * 2 + 1;
    setMousePosition({ x: initialX, y: initialY });
    
    console.log('Mouse tracking initialized with initial position:', { x: initialX, y: initialY });
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isTracking]);

  const handleClick = () => {
    setIsTracking(!isTracking);
    console.log('Tracking toggled:', !isTracking);
  };

  return (
    <div 
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '600px',
        zIndex: 15,
        pointerEvents: 'auto',
        opacity: 0.9,
        cursor: 'pointer'
      }}
      onClick={handleClick}
      onMouseMove={(e) => {
        if (!isTracking) return;
        
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = -(e.clientY / window.innerHeight) * 2 + 1;
        setMousePosition({ x, y });
      }}
    >
      {/* 상태 표시 */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: isTracking ? 'rgba(59, 130, 246, 0.9)' : 'rgba(100, 116, 139, 0.9)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 'bold',
        zIndex: 20,
        pointerEvents: 'none'
      }}>
        {isTracking ? '🎯 TRACKING' : '⏸️ IDLE'}
      </div>
      
      <Canvas
        camera={{ position: [0, 0, 3] }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        {/* 맑고 청아한 조명 설정 */}
        <ambientLight intensity={0.6} color="#ffffff" />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={1.2} 
          color="#ffffff"
        />
        <directionalLight 
          position={[-5, -5, -5]} 
          intensity={0.8} 
          color="#e0f2fe"
        />
        <pointLight 
          position={[0, 5, 0]} 
          intensity={1.0} 
          color="#ffffff"
        />
        <pointLight 
          position={[0, -5, 0]} 
          intensity={0.5} 
          color="#e0f2fe"
        />
        
        <GlassCollectiveModel mousePosition={mousePosition} isTracking={isTracking} />
      </Canvas>
    </div>
  );
};

export default GlassCollectiveScene; 