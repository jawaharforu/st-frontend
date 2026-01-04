"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { API_URL } from "@/lib/axios";

// Schema
// User sends: username (email), password (formData usually for OAuth2, but we can do JSON)
// Backend: `form_data: OAuth2PasswordRequestForm = Depends()` -> expects `username`, `password` as form fields.
// And headers content-type application/x-www-form-urlencoded usually?
// Backend `auth/login` uses `OAuth2PasswordRequestForm`. 
// So we must send `username` and `password` as form-data.

const schema = z.object({
    email: z.string().email(),
    password: z.string().min(5),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
    const [error, setError] = useState("");
    const { login } = useAuth();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        setError("");
        try {
            // Must use form-data for OAuth2 spec in FastAPI usually
            const params = new URLSearchParams();
            params.append('username', data.email);
            params.append('password', data.password);

            const res = await axios.post(`${API_URL}/auth/login`, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            // Response: { access_token, token_type, expires_in }
            const { access_token } = res.data;

            // Get user details (role) - we might need another call or decode token
            // For now, let's fetch /users/me or decode
            // Simplest: call /users/me

            const userRes = await axios.get(`${API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${access_token}` }
            });

            login(access_token, userRes.data);

        } catch (e: any) {
            if (e.response?.status === 400 || e.response?.status === 401) {
                setError("Invalid email or password");
            } else {
                setError("Login failed. Check connection.");
            }
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-zinc-900">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Welcome Back</CardTitle>
                    <CardDescription>Login to Smart Incubator Dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="admin@example.com" {...register("email")} />
                            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" {...register("password")} />
                            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Logging in..." : "Login"}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="text-center text-sm text-gray-500">
                    Contact admin if you forgot credentials.
                </CardFooter>
            </Card>
        </div>
    );
}
