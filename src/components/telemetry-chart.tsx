"use client";

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';

interface TelemetryChartProps {
    data: any[];
}

export function TelemetryChart({ data }: TelemetryChartProps) {
    const chartData = useMemo(() => {
        // Sort by date asc
        if (!data) return [];
        return [...data].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()).map(d => ({
            ...d,
            timeStr: format(new Date(d.ts), 'HH:mm:ss')
        }));
    }, [data]);

    if (!chartData.length) return <div className="h-[300px] flex items-center justify-center text-gray-400">No data available</div>;

    return (
        <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="timeStr" minTickGap={30} fontSize={12} />
                    <YAxis yAxisId="left" domain={['auto', 'auto']} fontSize={12} label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft' }} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} fontSize={12} label={{ value: 'Humidity (%)', angle: 90, position: 'insideRight' }} />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                        itemStyle={{ color: 'var(--foreground)' }}
                    />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="temp_c" stroke="#ef4444" name="Temperature" dot={false} strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="hum_pct" stroke="#3b82f6" name="Humidity" dot={false} strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
