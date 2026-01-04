import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface User {
    id: string;
    email: string;
    full_name?: string;
    role: string;
    created_at?: string;
}

interface UserListProps {
    users: User[];
    isLoading: boolean;
}

export function UserList({ users, isLoading }: UserListProps) {
    if (isLoading) {
        return <div className="p-4">Loading users...</div>;
    }

    if (users.length === 0) {
        return (
            <div className="text-center p-10 border border-dashed rounded-lg">
                <h3 className="text-lg font-medium">No users found</h3>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Users ({users.length})</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-secondary/50">
                            <tr>
                                <th className="px-6 py-3">Full Name</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50">
                                    <td className="px-6 py-4 font-medium">
                                        {user.full_name || "-"}
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.email}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${user.role === 'admin'
                                                ? 'bg-purple-50 text-purple-700 ring-purple-600/20'
                                                : 'bg-blue-50 text-blue-700 ring-blue-600/20'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
