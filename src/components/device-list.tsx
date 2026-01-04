"use client";

import { DeviceCard } from "@/components/device-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

interface Device {
    id: string;
    device_id: string;
    model: string;
    firmware_version?: string;
    status: string;
    farm_id?: string;
    last_seen?: string;
    latest_telemetry?: any;
}

interface DeviceListProps {
    devices: Device[];
    isLoading: boolean;
    farmId?: string; // If provided and not 'all', show Add button
}

export function DeviceList({ devices, isLoading, farmId }: DeviceListProps) {
    if (isLoading) {
        return <div className="p-4">Loading devices...</div>;
    }

    if (devices.length === 0) {
        return (
            <div className="text-center p-10 border border-dashed rounded-lg">
                <h3 className="text-lg font-medium">No devices found</h3>
                <p className="text-muted-foreground mb-4">Get started by adding a device.</p>
                {farmId && farmId !== "all" && (
                    <Link href={`/farms/${farmId}/devices/new`}>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" /> Add Device
                        </Button>
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Devices ({devices.length})</h2>
                {/* {farmId && farmId !== "all" && (
                    <Link href={`/farms/${farmId}/devices/new`}>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" /> Add Device
                        </Button>
                    </Link>
                )} */}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {devices.map((device) => (
                    <DeviceCard key={device.id} device={device} telemetry={device.latest_telemetry} />
                ))}
            </div>
        </div>
    );
}
