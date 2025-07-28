import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Stars } from '@react-three/drei';
import ThreeDModel from './ThreeDModel';

interface ThreeDSceneProps {
  modelPath: string;
  className?: string;
  style?: React.CSSProperties;
}

const ThreeDScene: React.FC<ThreeDSceneProps> = ({ 
  modelPath, 
  className = '', 
  style = {} 
}) => {
  return (
    <div 
      className={`three-d-scene ${className}`}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1,
        pointerEvents: 'none',
        ...style
      }}
    >
      <Canvas
        camera={{ 
          position: [0, 0, 5], 
          fov: 75,
          near: 0.1,
          far: 1000
        }}
        style={{ background: 'transparent' }}
        gl={{ 
          alpha: true, 
          antialias: true,
          powerPreference: 'high-performance'
        }}
      >
        {/* 조명 설정 */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1} 
          castShadow 
        />
        <pointLight 
          position={[-10, -10, -5]} 
          intensity={0.5} 
          color="#64748b"
        />
        
        {/* 환경 조명 */}
        <Environment preset="city" />
        
        {/* 배경 별들 */}
        <Stars 
          radius={100} 
          depth={50} 
          count={5000} 
          factor={4} 
          saturation={0} 
          fade 
          speed={1}
        />
        
        {/* 3D 모델 */}
        <ThreeDModel
          modelPath={modelPath}
          scale={1.5}
          position={[0, 0, 0]}
          autoRotate={true}
          hoverEffect={true}
        />
        
        {/* 카메라 컨트롤 (선택적) */}
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          enableRotate={false}
          autoRotate={false}
        />
      </Canvas>
    </div>
  );
};

export default ThreeDScene; 