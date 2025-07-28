import React from 'react';
import { Canvas } from '@react-three/fiber';

const Simple3DTest: React.FC = () => {
  return (
    <div 
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '300px',
        height: '300px',
        zIndex: 10,
        border: '2px solid red',
        background: 'rgba(255, 0, 0, 0.1)'
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5] }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <mesh>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="red" />
        </mesh>
      </Canvas>
    </div>
  );
};

export default Simple3DTest; 