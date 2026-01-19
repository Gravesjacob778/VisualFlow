import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { Box } from './Box';

export function BasicScene() {
    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <Canvas
                camera={{ position: [5, 5, 5], fov: 50 }}
                shadows
            >
                {/* Lighting */}
                <ambientLight intensity={0.5} />
                <directionalLight
                    position={[10, 10, 5]}
                    intensity={1}
                    castShadow
                    shadow-mapSize-width={1024}
                    shadow-mapSize-height={1024}
                />

                {/* Sample Object */}
                <Box position={[0, 1, 0]} />

                {/* Ground Grid */}
                <Grid
                    args={[10, 10]}
                    cellSize={1}
                    cellColor="#6f6f6f"
                    sectionSize={5}
                    sectionColor="#9d4b4b"
                />

                {/* Camera Controls */}
                <OrbitControls />
            </Canvas>
        </div>
    );
}
