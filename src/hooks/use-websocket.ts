import { useEffect, useRef, useState, useCallback } from 'react';

type WebSocketMessage = {
    type: string;
    data: any;
    device_id?: string;
    farm_id?: string;
}

export function useWebSocket(farmId: string, token: string | null) {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<any>(null);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!farmId || !token) return;

        // Construct URL
        // TODO: Environment variable for WS URL
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
        const url = `${wsUrl}/ws/farms/${farmId}?token=${token}`;

        console.log("Connecting to WS:", url);
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("WS Connected");
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                // The backend might send plain string or JSON
                const data = JSON.parse(event.data);
                setLastMessage(data);
            } catch (e) {
                console.error("WS Parse Error", e);
            }
        };

        ws.onclose = () => {
            console.log("WS Disconnected");
            setIsConnected(false);
        };

        return () => {
            ws.close();
        };
    }, [farmId, token]);

    const sendMessage = useCallback((msg: any) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(msg));
        }
    }, []);

    return { isConnected, lastMessage, sendMessage };
}
