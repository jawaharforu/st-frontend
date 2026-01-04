"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/axios";

// Schema
const farmSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    location: z.string().optional(),
});

type FarmFormValues = z.infer<typeof farmSchema>;

export default function NewFarmPage() {
    const router = useRouter();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FarmFormValues>({
        resolver: zodResolver(farmSchema),
    });

    const onSubmit = async (data: FarmFormValues) => {
        try {
            await api.post("/farms/", data);
            router.push("/farms");
            router.refresh();
        } catch (error: any) {
            console.error("Failed to create farm", error);
            const msg = error.response?.data?.detail || "Failed to create farm. Please try again.";
            alert(msg);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-2">
                <Link href="/farms">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Add New Farm</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Farm Details</CardTitle>
                    <CardDescription>
                        Create a new farm and assign an owner account.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Farm Name</Label>
                            <Input id="name" placeholder="e.g. Green Valley Hatchery" {...register("name")} />
                            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Owner Email</Label>
                            <Input id="email" type="email" placeholder="owner@example.com" {...register("email")} />
                            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Owner Password</Label>
                            <Input id="password" type="password" placeholder="******" {...register("password")} />
                            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">Location (Optional)</Label>
                            <Input id="location" placeholder="e.g. Springfield, IL" {...register("location")} />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Link href="/farms">
                            <Button variant="outline" type="button">Cancel</Button>
                        </Link>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Creating..." : "Create Farm"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
