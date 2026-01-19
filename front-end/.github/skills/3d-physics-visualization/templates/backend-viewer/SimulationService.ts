export class SimulationService {
    private ws: WebSocket | null = null;
    private stateUpdateCallback: ((state: any) => void) | null = null;
    private connectionChangeCallback: ((connected: boolean) => void) | null = null;
    private reconnectTimeout: NodeJS.Timeout | null = null;

    connect(url: string) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            return; // Already connected
        }

        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            console.log('✅ Connected to physics server');
            this.connectionChangeCallback?.(true);

            // Clear any pending reconnection
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = null;
            }
        };

        this.ws.onmessage = (event: MessageEvent) => {
            try {
                const state = JSON.parse(event.data);
                this.stateUpdateCallback?.(state);
            } catch (error) {
                console.error('Failed to parse state update:', error);
            }
        };

        this.ws.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
        };

        this.ws.onclose = () => {
            console.log('🔌 Disconnected from physics server');
            this.connectionChangeCallback?.(false);

            // Attempt reconnection after 2 seconds
            this.reconnectTimeout = setTimeout(() => {
                console.log('🔄 Attempting to reconnect...');
                this.connect(url);
            }, 2000);
        };
    }

    sendCommand(command: string, payload: any) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ command, payload }));
        } else {
            console.warn('Cannot send command: WebSocket not connected');
        }
    }

    onStateUpdate(callback: (state: any) => void) {
        this.stateUpdateCallback = callback;
    }

    onConnectionChange(callback: (connected: boolean) => void) {
        this.connectionChangeCallback = callback;
    }

    disconnect() {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}
