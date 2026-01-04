"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAuth } from "@/hooks/use-auth";
import { DeviceCard } from "@/components/device-card";

const fetchFarmDevices = async (farmId: string) => {
    const res = await api.get(`/farms/${farmId}/devices`);
    return res.data;
};

const fetchLatestTelemetry = async (farmId: string) => {
    const res = await api.get(`/farms/${farmId}/telemetry/latest`);
    return res.data; // Array of telemetry objects
}

export default function FarmDashboard() {
    const params = useParams();
    const farmId = params.farmId as string;
    const { token } = useAuth();

    // 1. Fetch Devices list
    const { data: devices, isLoading } = useQuery({
        queryKey: ["farm-devices", farmId],
        queryFn: () => fetchFarmDevices(farmId),
        enabled: !!farmId
    });

    // 2. Fetch Initial Latest Telemetry
    const { data: initialTelemetry } = useQuery({
        queryKey: ["farm-telemetry-latest", farmId],
        queryFn: () => fetchLatestTelemetry(farmId),
        enabled: !!farmId
    });

    // 3. WebSocket for Real-time
    const { lastMessage, isConnected } = useWebSocket(farmId, token);

    // Store telemetry map: device_id (UUID) -> telemetry object
    const [telemetryMap, setTelemetryMap] = useState<Record<string, any>>({});

    useEffect(() => {
        if (initialTelemetry) {
            const map: Record<string, any> = {};
            initialTelemetry.forEach((t: any) => {
                map[t.device_id] = t;
            });
            setTelemetryMap(prev => ({ ...prev, ...map }));
        }
    }, [initialTelemetry]);

    useEffect(() => {
        if (lastMessage && lastMessage.type === "telemetry") {
            // message format: { type: "telemetry", device_id: uuid, data: {...} }
            // The `data` field contains the actual telemetry record from DB/Model
            setTelemetryMap(prev => ({
                ...prev,
                [lastMessage.device_id]: lastMessage.data
            }));
        }
    }, [lastMessage]);

    if (isLoading) return <div>Loading devices...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Farm Dashboard</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>ID: {farmId}</span>
                        {isConnected ? (
                            <span className="text-green-500 flex items-center gap-1">• Live</span>
                        ) : (
                            <span className="text-red-500 flex items-center gap-1">• Disconnected</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {devices?.map((device: any) => (
                    <DeviceCard
                        key={device.id}
                        device={device}
                        telemetry={telemetryMap[device.id]}
                    />
                ))}
            </div>
        </div>
    );
}
