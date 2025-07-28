import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TestBoxProps {
  mousePosition: { x: number; y: number };
}

const TestBox: React.FC<TestBoxProps> = ({ mousePosition }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // 마우스 위치에 따라 회전
      meshRef.current.rotation.x = mousePosition.y * 2.0;
      meshRef.current.rotation.y = mousePosition.x * 2.0;
      
      // 자동 회전
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial 
        color="#3b82f6" 
        metalness={0.1}
        roughness={0.3}
      />
    </mesh>
  );
};

const Test3DBox: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      
      setMousePosition({ x, y });
      console.log('Mouse moved:', { x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    
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
        width: '400px',
        height: '400px',
        zIndex: 1,
        pointerEvents: 'none',
        border: '2px solid red'
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5] }}
        style={{ background: 'rgba(0,0,0,0.1)' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        
        <TestBox mousePosition={mousePosition} />
      </Canvas>
    </div>
  );
};

export default Test3DBox; 