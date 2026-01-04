"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "@/lib/axios"; // Import the configured instance
import { useParams, useRouter } from "next/navigation";
import { DeviceList } from "@/components/device-list";
import { API_URL } from "@/lib/axios";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Settings, Trash2, Edit } from "lucide-react";
import { useState } from "react";
import api from "@/lib/axios";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function FarmDevicesPage() {
    const params = useParams();
    const router = useRouter();
    const farmId = params.farmId as string;
    const { token } = useAuth();

    // Farm CRUD State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editName, setEditName] = useState("");
    const [editLocation, setEditLocation] = useState("");
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Fetch Devices
    const { data: devices, isLoading, error } = useQuery({
        queryKey: ['devices', farmId],
        queryFn: async () => {
            if (!token) return [];
            const url = farmId === 'all'
                ? `${API_URL}/devices/`
                : `${API_URL}/farms/${farmId}/devices`;

            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        },
        enabled: !!token
    });

    // Fetch Farm Details (if not 'all')
    const { data: farm, refetch: refetchFarm } = useQuery({
        queryKey: ['farm', farmId],
        queryFn: async () => {
            if (farmId === 'all') return { name: "All Devices" };
            // Since we list farms in the sidebar, we might already have it, 
            // but let's fetch individual farm if needed or just rely on list?
            // Current Backend doesn't have GET /farms/{id}, only /farms lists all.
            // Let's rely on the user knowing which farm it is, OR implement GET /farms/{id}
            // Wait, we implemented GET /farms (list).
            // Let's filter from the list or implement GET /farms/{id}.
            // Actually `read_farm_devices` verifies farm existence.
            // Let's quickly implement GET /farms/{id} in backend or filter client side?
            // Client side filter is safest for now without backend change.
            const res = await axios.get(`${API_URL}/farms/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const found = res.data.find((f: any) => f.id === farmId);
            if (found) {
                setEditName(found.name);
                setEditLocation(found.location || "");
            }
            return found || { name: "Unknown Farm" };
        },
        enabled: !!token && farmId !== 'all'
    });

    const queryClient = useQueryClient();

    const handleDeleteFarm = async () => {
        setIsActionLoading(true);
        try {
            await api.delete(`/farms/${farmId}`);
            await queryClient.invalidateQueries({ queryKey: ['farms'] });
            router.push("/farms");
        } catch (error) {
            console.error("Failed to delete farm", error);
            alert("Failed to delete farm");
        } finally {
            setIsActionLoading(false);
            setIsDeleteOpen(false);
        }
    };

    const handleUpdateFarm = async () => {
        setIsActionLoading(true);
        try {
            await api.put(`/farms/${farmId}`, { name: editName, location: editLocation });
            refetchFarm();
            setIsEditOpen(false);
        } catch (error) {
            console.error("Failed to update farm", error);
            alert("Failed to update farm");
        } finally {
            setIsActionLoading(false);
        }
    };


    if (error) {
        return <div className="p-4 text-red-500">Error loading devices: {(error as any).message}</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{farm ? farm.name : "Devices"}</h1>
                    {farm?.location && <p className="text-muted-foreground">{farm.location}</p>}
                </div>

                <div className="flex gap-2">
                    {farmId !== 'all' && (
                        <>
                            <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
                                <Edit className="h-4 w-4 mr-2" /> Edit Farm
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => setIsDeleteOpen(true)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Farm
                            </Button>
                            <Link href={`/farms/${farmId}/devices/new`}>
                                <Button size="sm">
                                    <Plus className="h-4 w-4 mr-2" /> Add Device
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>

            <DeviceList devices={devices || []} isLoading={isLoading} farmId={farmId} />

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Farm</DialogTitle>
                        <DialogDescription>Update farm details.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" value={editName} onChange={(e) => setEditName(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="location" className="text-right">Location</Label>
                            <Input id="location" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateFarm} disabled={isActionLoading}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Farm</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this farm? This will also delete all associated devices and data. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteFarm} disabled={isActionLoading}>Delete Farm</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
