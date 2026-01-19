import { useEffect, useState, useRef } from 'react';
import { SimulationService } from './SimulationService';

export interface PhysicsObject {
    id: string;
    position: [number, number, number];
    rotation: [number, number, number];
    velocity: [number, number, number];
}

export interface SimulationState {
    timestamp: number;
    objects: PhysicsObject[];
    isPaused: boolean;
}

export function usePhysicsSync(simulationId: string) {
    const [objects, setObjects] = useState<PhysicsObject[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const serviceRef = useRef<SimulationService | null>(null);

    useEffect(() => {
        if (!simulationId) return;

        const service = new SimulationService();
        serviceRef.current = service;

        // Use environment variable or fallback to localhost
        const wsUrl = process.env.NEXT_PUBLIC_PHYSICS_WS_URL || 'ws://localhost:5195/physics';

        // Connect to backend
        service.connect(wsUrl);

        // Handle state updates from backend
        service.onStateUpdate((state: SimulationState) => {
            setObjects(state.objects);
            setIsLoading(false);
        });

        // Handle connection status changes
        service.onConnectionChange((connected) => {
            setIsConnected(connected);
        });

        return () => {
            service.disconnect();
        };
    }, [simulationId]);

    // Send commands to backend
    const sendCommand = (command: string, payload: any) => {
        if (serviceRef.current) {
            serviceRef.current.sendCommand(command, payload);
        }
    };

    return { objects, isConnected, isLoading, sendCommand };
}
