"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { TelemetryChart } from "@/components/telemetry-chart";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAuth } from "@/hooks/use-auth";
import { RotateCw, Power, Wind, Flame, RefreshCcw, Brain, AlertTriangle, CheckCircle, Lightbulb, Droplets } from "lucide-react";

interface DeviceStats {
    max_temp_c?: number;
    avg_temp_c?: number;
    max_hum_pct?: number;
    avg_hum_pct?: number;
}

interface AnalysisResult {
    status: string;
    temperature_status: string;
    humidity_status: string;
    summary_for_farmer: string;
    recommended_action: string;
}

const fetchDevice = async (id: string) => {
    const res = await api.get(`/devices/${id}`);
    return res.data;
};

const fetchHistory = async (id: string) => {
    // Get last 24h by default? backend dependent
    // API: GET /devices/{device_id}/telemetry?limit=100
    const res = await api.get(`/devices/${id}/telemetry?limit=200`);
    return res.data;
};

function formatUptime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

export default function DeviceDetailPage() {
    const params = useParams();
    const deviceId = params.deviceId as string;
    const { token } = useAuth();
    const queryClient = useQueryClient();

    const { data: device, isLoading: loadingDevice } = useQuery({
        queryKey: ["device", deviceId],
        queryFn: () => fetchDevice(deviceId),
        enabled: !!deviceId
    });

    const { data: history, isLoading: loadingHistory } = useQuery({
        queryKey: ["device-history", deviceId],
        queryFn: () => fetchHistory(deviceId),
        enabled: !!deviceId,
        refetchInterval: 60000 // Refresh history every minute
    });

    // We assume backend tracks commands.
    // Command Mutation
    // POST /devices/{device_id}/cmd
    const cmdMutation = useMutation({
        mutationFn: async (payload: { cmd: string, params?: any }) => {
            await api.post(`/devices/${deviceId}/cmd`, payload);
        },
        onSuccess: () => {
            alert("Command sent!");
        },
        onError: (err) => {
            alert("Failed to send command");
        }
    });

    const handleSendCmd = (cmd: string, params: any = {}) => {
        cmdMutation.mutate({ cmd, params });
    };

    // WebSocket for Real-time
    // We need farmId to connect to WS.
    const farmId = device?.farm_id;
    const { lastMessage } = useWebSocket(farmId, token);

    // Stats Query
    const { data: stats } = useQuery<DeviceStats>({
        queryKey: ["device-stats", deviceId],
        queryFn: async () => {
            const res = await api.get(`/devices/${deviceId}/stats`);
            return res.data;
        },
        enabled: !!deviceId,
        refetchInterval: 30000
    });

    // AI Analysis
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

    const handleAnalyze = async () => {
        try {
            setAnalyzing(true);
            const res = await api.post(`/devices/${deviceId}/analyze`);
            setAnalysis(res.data);
        } catch (e) {
            console.error(e);
            alert("Analysis failed. Please try again.");
        } finally {
            setAnalyzing(false);
        }
    };

    // Merge Realtime Data into Chart
    const [realtimeHistory, setRealtimeHistory] = useState<any[]>([]);

    useEffect(() => {
        if (history) {
            setRealtimeHistory(history);
        }
    }, [history]);

    useEffect(() => {
        if (lastMessage && lastMessage.type === "telemetry" && lastMessage.device_id === deviceId) {
            setRealtimeHistory(prev => {
                // Append new data, keeping last 200
                const newData = [...prev, lastMessage.data];
                if (newData.length > 200) newData.shift();
                return newData;
            });
        }
    }, [lastMessage, deviceId]);

    // Derived current state from last message or last history or device
    const current = realtimeHistory.length > 0 ? realtimeHistory[0] : {};
    // console.log(current, realtimeHistory);
    if (loadingDevice) return <div>Loading device...</div>;
    if (!device) return <div>Device not found</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{device.model}</h2>
                    <p className="text-muted-foreground">ID: {device.device_id}</p>
                </div>
                <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${(new Date().getTime() - new Date(device.last_seen || 0).getTime() < 120000) ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                        {(new Date().getTime() - new Date(device.last_seen || 0).getTime() < 120000) ? "Online" : "Offline"}
                    </span>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Stats Cards */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Temperature</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{current.temp_c?.toFixed(1) ?? "--"}°F</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Humidity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{current.hum_pct?.toFixed(1) ?? "--"}%</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Heaters</CardTitle>
                    </CardHeader>
                    <CardContent className="flex gap-4">
                        <div className={`flex items-center gap-1 ${current.primary_heater ? "text-orange-500 font-bold" : "text-gray-400"}`}>
                            <Flame className="w-5 h-5" /> Primary
                        </div>
                        <div className={`flex items-center gap-1 ${current.secondary_heater ? "text-orange-500 font-bold" : "text-gray-400"}`}>
                            <Flame className="w-5 h-5" /> Secondary
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">System</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm">
                            <span className="text-muted-foreground mr-2">IP:</span>
                            <span className="font-mono">{current.ip || "--"}</span>
                        </div>
                        <div className="text-sm mt-1">
                            <span className="text-muted-foreground mr-2">Uptime:</span>
                            <span className="font-mono">{current.uptime_s ? formatUptime(current.uptime_s) : "--"}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Actuator Status Grid */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
                <Card className={current.primary_heater ? "border-orange-200 bg-orange-50" : ""}>
                    <CardContent className="p-3 text-center">
                        <Flame className={`w-6 h-6 mx-auto mb-1 ${current.primary_heater ? "text-orange-500" : "text-gray-300"}`} />
                        <div className="text-xs font-medium">Pri Heater</div>
                        <div className={`text-sm font-bold ${current.primary_heater ? "text-orange-600" : "text-gray-400"}`}>
                            {current.primary_heater ? "ON" : "OFF"}
                        </div>
                    </CardContent>
                </Card>
                <Card className={current.secondary_heater ? "border-orange-200 bg-orange-50" : ""}>
                    <CardContent className="p-3 text-center">
                        <Flame className={`w-6 h-6 mx-auto mb-1 ${current.secondary_heater ? "text-orange-500" : "text-gray-300"}`} />
                        <div className="text-xs font-medium">Sec Heater</div>
                        <div className={`text-sm font-bold ${current.secondary_heater ? "text-orange-600" : "text-gray-400"}`}>
                            {current.secondary_heater ? "ON" : "OFF"}
                        </div>
                    </CardContent>
                </Card>
                <Card className={current.exhaust_fan ? "border-cyan-200 bg-cyan-50" : ""}>
                    <CardContent className="p-3 text-center">
                        <Wind className={`w-6 h-6 mx-auto mb-1 ${current.exhaust_fan ? "text-cyan-500" : "text-gray-300"}`} />
                        <div className="text-xs font-medium">Exhaust Fan</div>
                        <div className={`text-sm font-bold ${current.exhaust_fan ? "text-cyan-600" : "text-gray-400"}`}>
                            {current.exhaust_fan ? "ON" : "OFF"}
                        </div>
                    </CardContent>
                </Card>
                <Card className={current.sv_valve ? "border-purple-200 bg-purple-50" : ""}>
                    <CardContent className="p-3 text-center">
                        <Power className={`w-6 h-6 mx-auto mb-1 ${current.sv_valve ? "text-purple-500" : "text-gray-300"}`} />
                        <div className="text-xs font-medium">SV Valve</div>
                        <div className={`text-sm font-bold ${current.sv_valve ? "text-purple-600" : "text-gray-400"}`}>
                            {current.sv_valve ? "ON" : "OFF"}
                        </div>
                    </CardContent>
                </Card>
                <Card className={current.fan ? "border-blue-200 bg-blue-50" : ""}>
                    <CardContent className="p-3 text-center">
                        <Wind className={`w-6 h-6 mx-auto mb-1 ${current.fan ? "text-blue-500" : "text-gray-300"}`} />
                        <div className="text-xs font-medium">Fan</div>
                        <div className={`text-sm font-bold ${current.fan ? "text-blue-600" : "text-gray-400"}`}>
                            {current.fan ? "ON" : "OFF"}
                        </div>
                    </CardContent>
                </Card>
                <Card className={current.turning_motor ? "border-green-200 bg-green-50" : ""}>
                    <CardContent className="p-3 text-center">
                        <RotateCw className={`w-6 h-6 mx-auto mb-1 ${current.turning_motor ? "text-green-500" : "text-gray-300"}`} />
                        <div className="text-xs font-medium">Motor</div>
                        <div className={`text-sm font-bold ${current.turning_motor ? "text-green-600" : "text-gray-400"}`}>
                            {current.turning_motor ? "ON" : "OFF"}
                        </div>
                    </CardContent>
                </Card>
                <Card className={current.limit_switch ? "border-amber-200 bg-amber-50" : ""}>
                    <CardContent className="p-3 text-center">
                        <Power className={`w-6 h-6 mx-auto mb-1 ${current.limit_switch ? "text-amber-500" : "text-gray-300"}`} />
                        <div className="text-xs font-medium">Limit SW</div>
                        <div className={`text-sm font-bold ${current.limit_switch ? "text-amber-600" : "text-gray-400"}`}>
                            {current.limit_switch ? "ON" : "OFF"}
                        </div>
                    </CardContent>
                </Card>
                <Card className={current.door_light ? "border-yellow-200 bg-yellow-50" : ""}>
                    <CardContent className="p-3 text-center">
                        <Power className={`w-6 h-6 mx-auto mb-1 ${current.door_light ? "text-yellow-500" : "text-gray-300"}`} />
                        <div className="text-xs font-medium">Door Light</div>
                        <div className={`text-sm font-bold ${current.door_light ? "text-yellow-600" : "text-gray-400"}`}>
                            {current.door_light ? "ON" : "OFF"}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Telemetry History</CardTitle>
                </CardHeader>
                <CardContent>
                    <TelemetryChart data={realtimeHistory} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Device Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Main Actuator Controls */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Button
                            variant={current.primary_heater ? "default" : "outline"}
                            className={current.primary_heater ? "bg-orange-500 hover:bg-orange-600" : ""}
                            onClick={() => handleSendCmd("PRIMARY_HEATER", { state: !current.primary_heater })}
                        >
                            <Flame className="mr-2 h-4 w-4" /> Pri Heater {current.primary_heater ? "ON" : "OFF"}
                        </Button>
                        <Button
                            variant={current.secondary_heater ? "default" : "outline"}
                            className={current.secondary_heater ? "bg-orange-500 hover:bg-orange-600" : ""}
                            onClick={() => handleSendCmd("SECONDARY_HEATER", { state: !current.secondary_heater })}
                        >
                            <Flame className="mr-2 h-4 w-4" /> Sec Heater {current.secondary_heater ? "ON" : "OFF"}
                        </Button>
                        <Button
                            variant={current.door_light ? "default" : "outline"}
                            className={current.door_light ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                            onClick={() => handleSendCmd("DOOR_LIGHT", { state: !current.door_light })}
                        >
                            <Lightbulb className="mr-2 h-4 w-4" /> Door Light {current.door_light ? "ON" : "OFF"}
                        </Button>
                        <Button
                            variant={current.sv_valve ? "default" : "outline"}
                            className={current.sv_valve ? "bg-purple-500 hover:bg-purple-600" : ""}
                            onClick={() => handleSendCmd("SV_VALVE", { state: !current.sv_valve })}
                        >
                            <Droplets className="mr-2 h-4 w-4" /> SV Valve {current.sv_valve ? "ON" : "OFF"}
                        </Button>
                    </div>

                    {/* Secondary Controls */}
                    {/* <div className="border-t pt-4">
                        <p className="text-sm text-muted-foreground mb-3">System Controls</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Button variant="outline" onClick={() => handleSendCmd("TURN_MOTOR", { dir: "left" })}>
                                <RotateCw className="mr-2 h-4 w-4" /> Turn Left
                            </Button>
                            <Button variant="outline" onClick={() => handleSendCmd("TURN_MOTOR", { dir: "right" })}>
                                <RotateCw className="mr-2 h-4 w-4 scale-x-[-1]" /> Turn Right
                            </Button>
                            <Button variant="destructive" onClick={() => handleSendCmd("REBOOT")}>
                                <Power className="mr-2 h-4 w-4" /> Reboot
                            </Button>
                            <Button variant="secondary" onClick={() => handleSendCmd("OTA_CHECK")}>
                                <RefreshCcw className="mr-2 h-4 w-4" /> Check OTA
                            </Button>
                        </div>
                    </div> */}
                </CardContent>
            </Card>

            {/* Statistics Section */}
            < div className="grid gap-6 md:grid-cols-4" >
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Max Temp (24h)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.max_temp_c?.toFixed(1) ?? "--"}°C</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Avg Temp (24h)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.avg_temp_c?.toFixed(1) ?? "--"}°C</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Max Humidity (24h)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.max_hum_pct?.toFixed(0) ?? "--"}%</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Avg Humidity (24h)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.avg_hum_pct?.toFixed(0) ?? "--"}%</div>
                    </CardContent>
                </Card>
            </div >

            {/* AI Analysis Section */}
            < Card className="border-indigo-100 shadow-sm overflow-hidden" >
                <div className="bg-indigo-50/50 p-6 border-b border-indigo-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-indigo-950 flex items-center gap-2">
                            <Brain className="w-5 h-5 text-indigo-600" />
                            AI Health Analysis
                        </h3>
                        <p className="text-sm text-indigo-600/80">Powered by Gemini AI</p>
                    </div>
                    <Button
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
                    >
                        {analyzing ? <RefreshCcw className="w-4 h-4 animate-spin mr-2" /> : <Brain className="w-4 h-4 mr-2" />}
                        {analyzing ? "Analyzing..." : "Analyze Health"}
                    </Button>
                </div>

                {
                    analysis && (
                        <CardContent className="p-6">
                            <div className={`rounded-xl p-4 border mb-4 ${analysis.status === 'NORMAL' ? 'bg-green-50 border-green-200 text-green-900' :
                                analysis.status === 'CAUTION' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                                    'bg-red-50 border-red-200 text-red-900'
                                }`}>
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-full ${analysis.status === 'NORMAL' ? 'bg-green-100' :
                                        analysis.status === 'CAUTION' ? 'bg-amber-100' :
                                            'bg-red-100'
                                        }`}>
                                        {analysis.status === 'NORMAL' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg mb-1">{analysis.status}</h4>
                                        <p className="opacity-90">{analysis.summary_for_farmer}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Recommendation</span>
                                    <p className="font-medium text-slate-700">{analysis.recommended_action}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className={`p-4 rounded-lg border ${analysis.temperature_status === 'NORMAL' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'
                                        }`}>
                                        <span className="text-xs uppercase tracking-wider opacity-70 block mb-1">Temperature</span>
                                        <span className="font-bold">{analysis.temperature_status || "UNKNOWN"}</span>
                                    </div>
                                    <div className={`p-4 rounded-lg border ${analysis.humidity_status === 'NORMAL' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-blue-50 border-blue-100 text-blue-800'
                                        }`}>
                                        <span className="text-xs uppercase tracking-wider opacity-70 block mb-1">Humidity</span>
                                        <span className="font-bold">{analysis.humidity_status || "UNKNOWN"}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    )
                }
            </Card >
        </div >
    );
}
