import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TrackingSphereProps {
  mousePosition: { x: number; y: number };
}

const TrackingSphere: React.FC<TrackingSphereProps> = ({ mousePosition }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [targetRotation, setTargetRotation] = useState({ x: 0, y: 0 });
  const [currentRotation, setCurrentRotation] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setTargetRotation({
      x: mousePosition.y * 0.5,
      y: mousePosition.x * 0.5
    });
  }, [mousePosition]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // 부드러운 회전 애니메이션
    const damping = 0.1;
    currentRotation.x += (targetRotation.x - currentRotation.x) * damping;
    currentRotation.y += (targetRotation.y - currentRotation.y) * damping;
    
    meshRef.current.rotation.x = currentRotation.x;
    meshRef.current.rotation.y = currentRotation.y;
    
    // 자동 회전 (마우스가 중앙에 있을 때)
    if (Math.abs(mousePosition.x) < 0.1 && Math.abs(mousePosition.y) < 0.1) {
      meshRef.current.rotation.y += delta * 0.8;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial 
        color="#64748b" 
        metalness={0.6}
        roughness={0.2}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
};

const MouseTracking3D: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const normalizedX = (event.clientX / window.innerWidth) * 2 - 1;
      const normalizedY = -(event.clientY / window.innerHeight) * 2 + 1;
      
      // 디버깅을 위한 콘솔 로그 (나중에 제거)
      console.log('Mouse position:', { x: normalizedX, y: normalizedY });
      
      setMousePosition({ x: normalizedX, y: normalizedY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '400px',
        height: '400px',
        zIndex: 1,
        pointerEvents: 'none',
        opacity: 0.7
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 3] }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <pointLight position={[-5, -5, -5]} intensity={0.4} color="#64748b" />
        
        <TrackingSphere mousePosition={mousePosition} />
      </Canvas>
    </div>
  );
};

export default MouseTracking3D; 