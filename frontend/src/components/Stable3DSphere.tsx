import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface StableSphereProps {
  mousePosition: { x: number; y: number };
}

const StableSphere: React.FC<StableSphereProps> = ({ mousePosition }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [targetRotation, setTargetRotation] = useState({ x: 0, y: 0 });
  const [currentRotation, setCurrentRotation] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setTargetRotation({
      x: mousePosition.y * 2.0,
      y: mousePosition.x * 2.0
    });
  }, [mousePosition]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // 부드러운 회전 애니메이션 (lerp)
      const damping = 0.08;
      currentRotation.x += (targetRotation.x - currentRotation.x) * damping;
      currentRotation.y += (targetRotation.y - currentRotation.y) * damping;
      
      meshRef.current.rotation.x = currentRotation.x;
      meshRef.current.rotation.y = currentRotation.y;
      
      // 자동 회전 (마우스가 중앙에 있을 때)
      if (Math.abs(mousePosition.x) < 0.1 && Math.abs(mousePosition.y) < 0.1) {
        meshRef.current.rotation.y += delta * 1.0;
      }
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.5, 32, 32]} />
      <meshStandardMaterial 
        color="#64748b" 
        metalness={0.7}
        roughness={0.1}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
};

const Stable3DSphere: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      setMousePosition({ x, y });
    };

    document.addEventListener('mousemove', handleMouseMove);
    
    // 초기 마우스 위치 설정
    const initialX = (window.innerWidth / 2 / window.innerWidth) * 2 - 1;
    const initialY = -(window.innerHeight / 2 / window.innerHeight) * 2 + 1;
    setMousePosition({ x: initialX, y: initialY });
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div 
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        height: '500px',
        zIndex: 1,
        pointerEvents: 'none',
        opacity: 0.8
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 3] }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <pointLight position={[-5, -5, -5]} intensity={0.4} color="#64748b" />
        
        <StableSphere mousePosition={mousePosition} />
      </Canvas>
    </div>
  );
};

export default Stable3DSphere; 