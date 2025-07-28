import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SphereProps {
  mousePosition: { x: number; y: number };
}

const Sphere: React.FC<SphereProps> = ({ mousePosition }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // 마우스 위치에 따라 직접 회전 적용
      meshRef.current.rotation.x = mousePosition.y * 1.0;
      meshRef.current.rotation.y = mousePosition.x * 1.0;
      
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
        color="#ef4444" 
        metalness={0.3}
        roughness={0.2}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
};

const SimpleMouseTracking3D: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // 마우스 위치를 -1에서 1 사이로 정규화
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      setMousePosition({ x, y });
      console.log('Mouse moved:', { x, y });
    };

    // 이벤트 리스너 추가
    window.addEventListener('mousemove', handleMouseMove);
    
    // 초기 마우스 위치 설정
    const initialX = (window.innerWidth / 2 / window.innerWidth) * 2 - 1;
    const initialY = -(window.innerHeight / 2 / window.innerHeight) * 2 + 1;
    setMousePosition({ x: initialX, y: initialY });
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
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
        opacity: 0.9
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 3] }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        
        <Sphere mousePosition={mousePosition} />
      </Canvas>
    </div>
  );
};

export default SimpleMouseTracking3D; 