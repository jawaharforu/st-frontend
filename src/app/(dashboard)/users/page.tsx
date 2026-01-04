"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { UserList } from "@/components/user-list";

export default function UsersPage() {
    const { data: users, isLoading } = useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            const response = await api.get("/users/");
            return response.data;
        },
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Users</h1>
            </div>

            <UserList users={users || []} isLoading={isLoading} />
        </div>
    );
}
