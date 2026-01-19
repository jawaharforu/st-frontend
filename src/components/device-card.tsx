"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Thermometer, Droplets, ArrowRight, Edit, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type DeviceCardProps = {
    device: any;
    telemetry: any;
};

// Simple helper to format uptime
function formatUptime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

export function DeviceCard({ device }: DeviceCardProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const isOnline = new Date().getTime() - new Date(device.last_seen || 0).getTime() < 120000;
    const telemetry = device.latest_telemetry || {};

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Edit form state
    const [editModel, setEditModel] = useState(device.model || "");
    const [editTempLow, setEditTempLow] = useState<number | "">(device.temp_low ?? "");
    const [editTempHigh, setEditTempHigh] = useState<number | "">(device.temp_high ?? "");
    const [editHumidityTemp, setEditHumidityTemp] = useState<number | "">(device.humidity_temp ?? "");
    const [editSensor1Offset, setEditSensor1Offset] = useState<number | "">(device.sensor1_offset ?? 0);
    const [editSensor2Offset, setEditSensor2Offset] = useState<number | "">(device.sensor2_offset ?? 0);
    const [editMotorMode, setEditMotorMode] = useState<number>(device.motor_mode ?? 0);
    const [editTimerSec, setEditTimerSec] = useState<number | "">(device.timer_sec ?? "");

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            await api.delete(`/devices/${device.id}`);
            await queryClient.invalidateQueries({ queryKey: ['devices'] });
            router.refresh();
        } catch (error) {
            console.error("Failed to delete device", error);
            alert("Failed to delete device");
        } finally {
            setIsLoading(false);
            setIsDeleteOpen(false);
        }
    };

    const handleUpdate = async () => {
        setIsLoading(true);
        try {
            // Save settings to database
            await api.put(`/devices/${device.id}`, {
                model: editModel,
                temp_low: editTempLow === "" ? null : editTempLow,
                temp_high: editTempHigh === "" ? null : editTempHigh,
                humidity_temp: editHumidityTemp === "" ? null : editHumidityTemp,
                sensor1_offset: editSensor1Offset === "" ? null : editSensor1Offset,
                sensor2_offset: editSensor2Offset === "" ? null : editSensor2Offset,
                motor_mode: editMotorMode,
                timer_sec: editTimerSec === "" ? null : editTimerSec,
            });

            // Send SET_CONFIG command to device via MQTT
            await api.post(`/devices/${device.id}/cmd`, {
                cmd: "SET_CONFIG",
                params: {
                    temp_low: editTempLow === "" ? null : editTempLow,
                    temp_high: editTempHigh === "" ? null : editTempHigh,
                    humidity_temp: editHumidityTemp === "" ? null : editHumidityTemp,
                    sensor1_offset: editSensor1Offset === "" ? null : editSensor1Offset,
                    sensor2_offset: editSensor2Offset === "" ? null : editSensor2Offset,
                    motor_mode: editMotorMode,
                    timer_sec: editTimerSec === "" ? null : editTimerSec,
                }
            });

            await queryClient.invalidateQueries({ queryKey: ['devices'] });
            router.refresh();
        } catch (error) {
            console.error("Failed to update device", error);
            alert("Failed to update device");
        } finally {
            setIsLoading(false);
            setIsEditOpen(false);
        }
    };

    return (
        <Card className="hover:shadow-lg transition-all duration-300 relative group overflow-hidden border-slate-200 bg-white">
            {/* Action Buttons - Always visible */}
            <div className="absolute top-3 right-3 flex gap-1 z-10">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" onClick={(e) => { e.preventDefault(); setIsEditOpen(true); }}>
                    <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" onClick={(e) => { e.preventDefault(); setIsDeleteOpen(true); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>

            <CardHeader className="pb-3 pt-5 px-5">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-red-500"}`} />
                            <CardTitle className="text-lg font-bold text-slate-900 leading-none">{device.model || "Unknown Model"}</CardTitle>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">{device.device_id}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex flex-col p-3 rounded-xl bg-red-50/50 border border-red-100">
                        <div className="flex items-center gap-1.5 text-red-500 mb-1">
                            <Thermometer className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Temp</span>
                        </div>
                        <span className="font-bold text-2xl text-slate-800">{telemetry.temp_c?.toFixed(1) ?? "--"}<span className="text-sm text-slate-500 font-medium ml-0.5">°F</span></span>
                    </div>
                    <div className="flex flex-col p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                        <div className="flex items-center gap-1.5 text-blue-500 mb-1">
                            <Droplets className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Sensor 2</span>
                        </div>
                        <span className="font-bold text-2xl text-slate-800">{telemetry.hum_pct?.toFixed(1) ?? "--"}<span className="text-sm text-slate-500 font-medium ml-0.5">°F</span></span>
                    </div>
                </div>

                {/* Actuator Status Grid */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className={`flex flex-col items-center p-2 rounded-lg border ${telemetry?.primary_heater ? "bg-orange-50 border-orange-200 text-orange-600" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
                        <span className="text-[9px] font-semibold uppercase">Pri Heat</span>
                        <span className="text-xs font-bold">{telemetry?.primary_heater ? "ON" : "OFF"}</span>
                    </div>
                    <div className={`flex flex-col items-center p-2 rounded-lg border ${telemetry?.secondary_heater ? "bg-orange-50 border-orange-200 text-orange-600" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
                        <span className="text-[9px] font-semibold uppercase">Sec Heat</span>
                        <span className="text-xs font-bold">{telemetry?.secondary_heater ? "ON" : "OFF"}</span>
                    </div>
                    <div className={`flex flex-col items-center p-2 rounded-lg border ${telemetry?.exhaust_fan ? "bg-cyan-50 border-cyan-200 text-cyan-600" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
                        <span className="text-[9px] font-semibold uppercase">Exhaust</span>
                        <span className="text-xs font-bold">{telemetry?.exhaust_fan ? "ON" : "OFF"}</span>
                    </div>
                    <div className={`flex flex-col items-center p-2 rounded-lg border ${telemetry?.fan ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
                        <span className="text-[9px] font-semibold uppercase">Fan</span>
                        <span className="text-xs font-bold">{telemetry?.fan ? "ON" : "OFF"}</span>
                    </div>
                </div>

                {/* Additional Status Row */}
                <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 rounded-lg p-2.5 mb-4 border border-slate-100">
                    <div className="flex items-center gap-3">
                        <span className={telemetry?.turning_motor ? "text-green-600 font-semibold" : "text-slate-400"}>
                            Motor: {telemetry?.turning_motor ? "ON" : "OFF"}
                        </span>
                        <span className={telemetry?.sv_valve ? "text-purple-600 font-semibold" : "text-slate-400"}>
                            Valve: {telemetry?.sv_valve ? "ON" : "OFF"}
                        </span>
                        <span className={telemetry?.door_light ? "text-yellow-600 font-semibold" : "text-slate-400"}>
                            Light: {telemetry?.door_light ? "ON" : "OFF"}
                        </span>
                    </div>
                    {telemetry?.uptime_s && (
                        <div className="font-mono">
                            UP: <span className="text-slate-700 font-semibold">{formatUptime(telemetry.uptime_s)}</span>
                        </div>
                    )}
                </div>

                <Link href={`/devices/${device.id}`} className="w-full">
                    <Button variant="outline" className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-100 group">
                        View Dashboard <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                    </Button>
                </Link>

                {/* Edit Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent onClick={(e) => e.stopPropagation()} className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Edit Device</DialogTitle>
                            <DialogDescription>Update device configuration.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-model">Model</Label>
                                <Input id="edit-model" value={editModel} onChange={(e) => setEditModel(e.target.value)} />
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="text-sm font-semibold mb-3 text-purple-600">Temperature Thresholds</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="edit-temp-low" className="text-xs">Low Threshold (°F)</Label>
                                        <Input id="edit-temp-low" type="number" step="0.1" value={editTempLow} onChange={(e) => setEditTempLow(e.target.value ? parseFloat(e.target.value) : "")} />
                                        <p className="text-[10px] text-muted-foreground">Heaters ON below this</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="edit-temp-high" className="text-xs">High Threshold (°F)</Label>
                                        <Input id="edit-temp-high" type="number" step="0.1" value={editTempHigh} onChange={(e) => setEditTempHigh(e.target.value ? parseFloat(e.target.value) : "")} />
                                        <p className="text-[10px] text-muted-foreground">Heaters OFF above this</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="text-sm font-semibold mb-3 text-purple-600">Cooling Threshold</h4>
                                <div className="space-y-1">
                                    <Label htmlFor="edit-humidity-temp" className="text-xs">Sensor 2 Threshold (°F)</Label>
                                    <Input id="edit-humidity-temp" type="number" step="0.1" value={editHumidityTemp} onChange={(e) => setEditHumidityTemp(e.target.value ? parseFloat(e.target.value) : "")} />
                                    <p className="text-[10px] text-muted-foreground">Cooling ON above this</p>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="text-sm font-semibold mb-3 text-purple-600">Sensor Calibration</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="edit-sensor1-offset" className="text-xs">Sensor 1 Offset</Label>
                                        <Input id="edit-sensor1-offset" type="number" step="0.1" value={editSensor1Offset} onChange={(e) => setEditSensor1Offset(e.target.value ? parseFloat(e.target.value) : "")} />
                                        <p className="text-[10px] text-muted-foreground">Add/subtract (°F)</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="edit-sensor2-offset" className="text-xs">Sensor 2 Offset</Label>
                                        <Input id="edit-sensor2-offset" type="number" step="0.1" value={editSensor2Offset} onChange={(e) => setEditSensor2Offset(e.target.value ? parseFloat(e.target.value) : "")} />
                                        <p className="text-[10px] text-muted-foreground">Add/subtract (°F)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="text-sm font-semibold mb-3 text-purple-600">Motor Control</h4>
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="edit-motor-mode" className="text-xs">Motor Mode</Label>
                                        <select
                                            id="edit-motor-mode"
                                            className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                                            value={editMotorMode}
                                            onChange={(e) => setEditMotorMode(parseInt(e.target.value))}
                                        >
                                            <option value={0}>Timer (Toggle ON/OFF)</option>
                                            <option value={1}>Always ON</option>
                                        </select>
                                    </div>
                                    {editMotorMode === 0 && (
                                        <div className="space-y-1 bg-slate-50 p-3 rounded-lg">
                                            <Label htmlFor="edit-timer" className="text-xs">Timer Interval (seconds)</Label>
                                            <Input id="edit-timer" type="number" step="1" value={editTimerSec} onChange={(e) => setEditTimerSec(e.target.value ? parseInt(e.target.value) : "")} />
                                            <p className="text-[10px] text-muted-foreground">Motor toggles every X seconds</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                            <Button onClick={handleUpdate} disabled={isLoading}>Save Changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Dialog */}
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogContent onClick={(e) => e.stopPropagation()}>
                        <DialogHeader>
                            <DialogTitle>Delete Device</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete this device? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>Delete</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </CardContent>
        </Card>
    );
}
