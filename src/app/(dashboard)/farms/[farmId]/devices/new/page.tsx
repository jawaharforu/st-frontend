"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/axios";

// Schema matching device settings
const deviceSchema = z.object({
    device_id: z.string().min(3, "Device ID is required"),
    model: z.string().min(1, "Model is required"),
    firmware_version: z.string().optional(),
    // Temperature Thresholds
    temp_low: z.number().optional(),
    temp_high: z.number().optional(),
    // Cooling Threshold
    humidity_temp: z.number().optional(),
    // Sensor Calibration
    sensor1_offset: z.number().optional(),
    sensor2_offset: z.number().optional(),
    // Motor Control
    motor_mode: z.number().int().min(0).max(1).optional(),
    timer_sec: z.number().int().min(0).optional(),
});

type DeviceFormValues = z.infer<typeof deviceSchema>;

export default function NewDevicePage() {
    const router = useRouter();
    const params = useParams();
    const farmId = params.farmId as string;
    const queryClient = useQueryClient();

    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<DeviceFormValues>({
        resolver: zodResolver(deviceSchema),
        defaultValues: {
            motor_mode: 0,
        }
    });

    const motorMode = watch("motor_mode");

    const createDevice = useMutation({
        mutationFn: async (data: DeviceFormValues) => {
            const res = await api.post(`/farms/${farmId}/devices`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["devices", farmId] });
            router.push(`/farms/${farmId}/devices`);
        },
        onError: (error) => {
            console.error("Failed to create device", error);
            alert("Failed to create device. Check if Device ID is unique.");
        }
    });

    const onSubmit = (data: DeviceFormValues) => {
        createDevice.mutate(data);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-2">
                <Link href={`/farms/${farmId}/devices`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Add New Device</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Device Details</CardTitle>
                    <CardDescription>
                        Register a new device to this farm.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-6">
                        {/* Basic Device Info */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="device_id">Device ID (MAC Address)</Label>
                                <Input id="device_id" placeholder="e.g. 48CA4336F070" {...register("device_id")} />
                                <p className="text-xs text-muted-foreground">Found in device serial monitor output</p>
                                {errors.device_id && <p className="text-sm text-red-500">{errors.device_id.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="model">Model</Label>
                                <Input id="model" placeholder="e.g. Smart Incubator" {...register("model")} />
                                {errors.model && <p className="text-sm text-red-500">{errors.model.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="firmware_version">Firmware Version (Optional)</Label>
                                <Input id="firmware_version" placeholder="e.g. 1.0.0" {...register("firmware_version")} />
                            </div>
                        </div>

                        {/* Temperature Thresholds */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold mb-4 text-purple-600">Temperature Thresholds</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="temp_low">Low Threshold (°F)</Label>
                                    <Input
                                        id="temp_low"
                                        type="number"
                                        step="0.1"
                                        placeholder="e.g. 97"
                                        {...register("temp_low", { valueAsNumber: true })}
                                    />
                                    <p className="text-xs text-muted-foreground">Both heaters ON below this</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="temp_high">High Threshold (°F)</Label>
                                    <Input
                                        id="temp_high"
                                        type="number"
                                        step="0.1"
                                        placeholder="e.g. 100"
                                        {...register("temp_high", { valueAsNumber: true })}
                                    />
                                    <p className="text-xs text-muted-foreground">Both heaters OFF above this</p>
                                </div>
                            </div>
                        </div>

                        {/* Cooling Threshold */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold mb-4 text-purple-600">Cooling Threshold</h3>
                            <div className="space-y-2">
                                <Label htmlFor="humidity_temp">Sensor 2 Threshold (°F)</Label>
                                <Input
                                    id="humidity_temp"
                                    type="number"
                                    step="0.1"
                                    placeholder="e.g. 86.6"
                                    {...register("humidity_temp", { valueAsNumber: true })}
                                />
                                <p className="text-xs text-muted-foreground">Cooling ON above this</p>
                            </div>
                        </div>

                        {/* Sensor Calibration */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold mb-4 text-purple-600">Sensor Calibration</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="sensor1_offset">Sensor 1 Offset (Temperature)</Label>
                                    <Input
                                        id="sensor1_offset"
                                        type="number"
                                        step="0.1"
                                        placeholder="0"
                                        {...register("sensor1_offset", { valueAsNumber: true })}
                                    />
                                    <p className="text-xs text-muted-foreground">Add/subtract from reading (°F)</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sensor2_offset">Sensor 2 Offset (Humidity)</Label>
                                    <Input
                                        id="sensor2_offset"
                                        type="number"
                                        step="0.1"
                                        placeholder="0"
                                        {...register("sensor2_offset", { valueAsNumber: true })}
                                    />
                                    <p className="text-xs text-muted-foreground">Add/subtract from reading (°F)</p>
                                </div>
                            </div>
                        </div>

                        {/* Motor Control */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold mb-4 text-purple-600">Motor Control</h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="motor_mode">Motor Mode</Label>
                                    <select
                                        id="motor_mode"
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                        {...register("motor_mode", { valueAsNumber: true })}
                                    >
                                        <option value={0}>Timer (Toggle ON/OFF)</option>
                                        <option value={1}>Always ON</option>
                                    </select>
                                </div>
                                {motorMode === 0 && (
                                    <div className="space-y-2 bg-slate-50 p-4 rounded-lg">
                                        <Label htmlFor="timer_sec">Timer Interval (seconds)</Label>
                                        <Input
                                            id="timer_sec"
                                            type="number"
                                            step="1"
                                            placeholder="e.g. 120"
                                            {...register("timer_sec", { valueAsNumber: true })}
                                        />
                                        <p className="text-xs text-muted-foreground">Motor will toggle ON/OFF every X seconds</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Link href={`/farms/${farmId}/devices`}>
                            <Button variant="outline" type="button">Cancel</Button>
                        </Link>
                        <Button type="submit" disabled={isSubmitting || createDevice.isPending}>
                            {createDevice.isPending ? "Registering..." : "Register Device"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
