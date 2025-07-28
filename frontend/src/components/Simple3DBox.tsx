import React from 'react';
import { Canvas } from '@react-three/fiber';

const Simple3DBox: React.FC = () => {
  return (
    <div 
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1,
        pointerEvents: 'none'
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5] }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <mesh>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
      </Canvas>
    </div>
  );
};

export default Simple3DBox; 