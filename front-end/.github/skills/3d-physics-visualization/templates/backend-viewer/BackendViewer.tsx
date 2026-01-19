import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { usePhysicsSync } from './usePhysicsSync';
import { InterpolatedObject } from './InterpolatedObject';

interface BackendViewerProps {
    simulationId: string;
}

export function BackendViewer({ simulationId }: BackendViewerProps) {
    const { objects, isConnected, isLoading, sendCommand } = usePhysicsSync(simulationId);

    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <Canvas shadows camera={{ position: [10, 10, 10], fov: 50 }}>
                {/* Lighting */}
                <ambientLight intensity={0.5} />
                <directionalLight
                    position={[10, 10, 5]}
                    castShadow
                    intensity={1}
                    shadow-mapSize-width={1024}
                    shadow-mapSize-height={1024}
                />

                {/* Connection Status */}
                {!isConnected && (
                    <Html center>
                        <div style={{
                            color: 'white',
                            background: 'rgba(0, 0, 0, 0.8)',
                            padding: '16px',
                            borderRadius: '8px',
                            fontSize: '14px'
                        }}>
                            {isLoading ? 'Connecting to physics server...' : 'Disconnected. Reconnecting...'}
                        </div>
                    </Html>
                )}

                {/* Render physics objects from backend */}
                {objects.map((obj) => (
                    <InterpolatedObject
                        key={obj.id}
                        targetPosition={obj.position}
                        targetRotation={obj.rotation}
                        onClick={() => {
                            // Example: Send command to backend to apply force
                            sendCommand('applyForce', {
                                objectId: obj.id,
                                force: [0, 10, 0]
                            });
                        }}
                    />
                ))}

                {/* Ground plane */}
                <mesh
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, 0, 0]}
                    receiveShadow
                >
                    <planeGeometry args={[100, 100]} />
                    <meshStandardMaterial color="#2f2f2f" />
                </mesh>

                {/* Camera controls */}
                <OrbitControls />
            </Canvas>
        </div>
    );
}
