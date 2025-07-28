import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import GlassCollectiveModel from './GlassCollectiveModel';

interface GlassCollectiveSceneProps {
  className?: string;
  style?: React.CSSProperties;
  showControls?: boolean;
}

const GlassCollectiveScene: React.FC<GlassCollectiveSceneProps> = ({ 
  className = '', 
  style = {},
  showControls = false
}) => {
  return (
    <div 
      className={`glass-collective-scene ${className}`}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 0,
        pointerEvents: 'none',
        ...style
      }}
    >
      <Canvas
        camera={{ 
          position: [0, 0, 4], 
          fov: 60,
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
        <ambientLight intensity={0.8} />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={1.2} 
          castShadow 
        />
        <directionalLight 
          position={[-5, 5, -5]} 
          intensity={0.6} 
          color="#64748b"
        />
        <pointLight 
          position={[0, 5, 0]} 
          intensity={0.5} 
          color="#ffffff"
        />
        
        {/* 환경 조명 */}
        <Environment preset="sunset" />
        
        {/* Glass Collective 3D 모델 */}
        <Suspense fallback={
          <mesh position={[0, 0, 0]} scale={1}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#64748b" />
          </mesh>
        }>
          <GlassCollectiveModel
            scale={1.5}
            position={[2, 0, 0]}
          />
        </Suspense>
        
        {/* 카메라 컨트롤 (선택적) */}
        {showControls && (
          <OrbitControls 
            enableZoom={false}
            enablePan={false}
            enableRotate={false}
            autoRotate={false}
          />
        )}
      </Canvas>
    </div>
  );
};

export default GlassCollectiveScene; 