"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Upload, FileCode } from "lucide-react";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fetchFirmware = async () => {
    const res = await api.get("/firmware");
    return res.data;
};

export default function FirmwarePage() {
    const queryClient = useQueryClient();
    const [file, setFile] = useState<File | null>(null);
    const [version, setVersion] = useState("");
    const [uploading, setUploading] = useState(false);

    const { data: firmwares, isLoading } = useQuery({
        queryKey: ["firmware"],
        queryFn: fetchFirmware
    });

    const uploadMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            // POST /api/v1/firmware
            // Body: version (query or form?), file (multipart)
            // Backend: version: str = Form(...), file: UploadFile = File(...)
            await api.post("/firmware", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["firmware"] });
            setFile(null);
            setVersion("");
            alert("Firmware uploaded successfully");
        },
        onError: () => {
            alert("Upload failed");
        }
    });

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !version) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("version", version);
        formData.append("file", file);
        formData.append("is_required", "false"); // Defaulting for demo

        try {
            await uploadMutation.mutateAsync(formData);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Firmware Management</h2>

            <Card>
                <CardHeader>
                    <CardTitle>Upload New Firmware</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpload} className="space-y-4 max-w-md">
                        <div className="space-y-2">
                            <Label htmlFor="version">Version (e.g., 1.0.2)</Label>
                            <Input
                                id="version"
                                value={version}
                                onChange={(e) => setVersion(e.target.value)}
                                placeholder="1.0.0"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="file">Binary File (.bin)</Label>
                            <Input
                                id="file"
                                type="file"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                accept=".bin"
                                required
                            />
                        </div>
                        <Button type="submit" disabled={uploading}>
                            {uploading ? "Uploading..." : <><Upload className="mr-2 h-4 w-4" /> Upload</>}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Available Firmware</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? <div>Loading...</div> : (
                        <div className="border rounded-md divide-y">
                            {firmwares?.map((fw: any) => (
                                <div key={fw.id} className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded">
                                            <FileCode className="h-5 w-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium">v{fw.version}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(fw.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Size: {(fw.size / 1024).toFixed(1)} KB
                                    </div>
                                </div>
                            ))}
                            {firmwares?.length === 0 && <div className="p-4 text-center text-gray-500">No firmware found.</div>}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
