"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, ArrowRight, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import api from "@/lib/axios";

// Fetcher
const fetchFarms = async () => {
    const res = await api.get("/farms/");
    return res.data;
};

export default function FarmsPage() {
    const { data: farms, isLoading, error } = useQuery({
        queryKey: ["farms"],
        queryFn: fetchFarms,
    });

    if (isLoading) return <div className="p-10 text-center">Loading farms...</div>;
    if (error) return <div className="p-10 text-center text-red-500">Error loading farms.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Farms</h2>
                    <p className="text-muted-foreground">Manage your incubator sites.</p>
                </div>
                <Link href="/farms/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Farm
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {farms?.map((farm: any) => (
                    <Card key={farm.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle>{farm.name}</CardTitle>
                            <CardDescription className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {farm.location || "Unknown Location"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* <p className="text-sm text-gray-500">Devices: {farm.device_count || 0}</p> */}
                            <div className="flex gap-2 mt-4">
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Active</span>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Link href={`/farms/${farm.id}/dashboard`}>
                                <Button variant="outline" size="sm">Dashboard</Button>
                            </Link>
                            <Link href={`/farms/${farm.id}/devices`}>
                                <Button variant="ghost" size="sm">Devices <ArrowRight className="ml-2 h-3 w-3" /></Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}
                {farms?.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-500">
                        No farms found. Create one to get started.
                    </div>
                )}
            </div>
        </div>
    );
}
