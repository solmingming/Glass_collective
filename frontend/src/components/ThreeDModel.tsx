import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface ThreeDModelProps {
  modelPath: string;
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  autoRotate?: boolean;
  hoverEffect?: boolean;
}

const ThreeDModel: React.FC<ThreeDModelProps> = ({
  modelPath,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  autoRotate = true,
  hoverEffect = true
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  // GLB 모델 로드
  const { scene } = useGLTF(modelPath);
  
  // 자동 회전 애니메이션
  useFrame((state) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  // 호버 효과
  useEffect(() => {
    if (!hoverEffect || !meshRef.current) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (!meshRef.current) return;
      
      const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
      
      meshRef.current.rotation.x = mouseY * 0.1;
      meshRef.current.rotation.y = mouseX * 0.1;
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [hoverEffect]);

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <primitive 
        ref={meshRef}
        object={scene} 
        scale={scale}
      />
    </group>
  );
};

export default ThreeDModel; 