import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ContainerSphereProps {
  mousePosition: { x: number; y: number };
}

const ContainerSphere: React.FC<ContainerSphereProps> = ({ mousePosition }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [targetRotation, setTargetRotation] = useState({ x: 0, y: 0 });
  const [currentRotation, setCurrentRotation] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setTargetRotation({
      x: mousePosition.y * 0.2,
      y: mousePosition.x * 0.2
    });
  }, [mousePosition]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // 부드러운 회전 애니메이션
    const damping = 0.08;
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
      <sphereGeometry args={[0.8, 24, 24]} />
      <meshStandardMaterial 
        color="#64748b" 
        metalness={0.8}
        roughness={0.1}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
};

const Container3DSphere: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const normalizedX = (event.clientX / window.innerWidth) * 2 - 1;
      const normalizedY = -(event.clientY / window.innerHeight) * 2 + 1;
      setMousePosition({ x: normalizedX, y: normalizedY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      style={{
        width: '120px',
        height: '120px',
        position: 'relative',
        pointerEvents: 'none'
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 2.5] }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 3, 3]} intensity={1.2} />
        <pointLight position={[-3, -3, -3]} intensity={0.6} color="#64748b" />
        
        <ContainerSphere mousePosition={mousePosition} />
      </Canvas>
    </div>
  );
};

export default Container3DSphere; 