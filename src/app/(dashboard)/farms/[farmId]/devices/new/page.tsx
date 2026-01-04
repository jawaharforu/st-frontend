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

// Schema with Device Type 3 Configuration Fields
const deviceSchema = z.object({
    device_id: z.string().min(3, "Device ID is required"),
    model: z.string().min(1, "Model is required"),
    firmware_version: z.string().optional(),
    // Device Type 3 Configuration (temperatures in Fahrenheit)
    temp_high: z.number().optional(),
    temp_low: z.number().optional(),
    temp_x: z.number().optional(),
    humidity: z.number().min(0).max(100).optional(),
    humidity_temp: z.number().optional(),
    timer_sec: z.number().int().min(0).optional(),
});

type DeviceFormValues = z.infer<typeof deviceSchema>;

export default function NewDevicePage() {
    const router = useRouter();
    const params = useParams();
    const farmId = params.farmId as string;
    const queryClient = useQueryClient();

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<DeviceFormValues>({
        resolver: zodResolver(deviceSchema),
    });

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
                                <Label htmlFor="device_id">Device ID (Serial Number)</Label>
                                <Input id="device_id" placeholder="e.g. SN-12345678" {...register("device_id")} />
                                {errors.device_id && <p className="text-sm text-red-500">{errors.device_id.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="model">Model</Label>
                                <Input id="model" placeholder="e.g. Incubator-Pro-X" {...register("model")} />
                                {errors.model && <p className="text-sm text-red-500">{errors.model.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="firmware_version">Firmware Version (Optional)</Label>
                                <Input id="firmware_version" placeholder="e.g. 1.0.0" {...register("firmware_version")} />
                            </div>
                        </div>

                        {/* Device Type 3 Configuration */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold mb-4">Incubator Configuration</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="temp_high">Temp High (°F)</Label>
                                    <Input
                                        id="temp_high"
                                        type="number"
                                        step="0.1"
                                        placeholder="e.g. 100.5"
                                        {...register("temp_high", { valueAsNumber: true })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="temp_low">Temp Low (°F)</Label>
                                    <Input
                                        id="temp_low"
                                        type="number"
                                        step="0.1"
                                        placeholder="e.g. 99.0"
                                        {...register("temp_low", { valueAsNumber: true })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="temp_x">Temp X (°F)</Label>
                                    <Input
                                        id="temp_x"
                                        type="number"
                                        step="0.1"
                                        placeholder="e.g. 99.5"
                                        {...register("temp_x", { valueAsNumber: true })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="humidity">Humidity (%)</Label>
                                    <Input
                                        id="humidity"
                                        type="number"
                                        step="1"
                                        placeholder="e.g. 65"
                                        {...register("humidity", { valueAsNumber: true })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="humidity_temp">Humidity Temp (°F)</Label>
                                    <Input
                                        id="humidity_temp"
                                        type="number"
                                        step="0.1"
                                        placeholder="e.g. 85.0"
                                        {...register("humidity_temp", { valueAsNumber: true })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="timer_sec">Timer (seconds)</Label>
                                    <Input
                                        id="timer_sec"
                                        type="number"
                                        step="1"
                                        placeholder="e.g. 3600"
                                        {...register("timer_sec", { valueAsNumber: true })}
                                    />
                                </div>
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

