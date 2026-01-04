"use client";

import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Server, LogOut, Activity } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    // If loading auth state?
    // We handle redirection in useAuth, so here we assume check passed or passing.

    if (!user && typeof window !== "undefined" && !localStorage.getItem("access_token")) {
        return null; // Or a loader
    }

    const navItems = [
        { name: "Farms", href: "/farms", icon: LayoutDashboard },
        { name: "Devices", href: "/farms/all/devices", icon: Server }, // Placeholder for all devices or logic
        // We navigate farms first usually.
        // Let's assume a "Farms" list is the root.
    ];

    if (user?.role === "admin") {
        navItems.push({ name: "Users", href: "/users", icon: Users });
        navItems.push({ name: "Firmware", href: "/firmware", icon: Activity });
    }

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
                <div className="p-6 border-b border-slate-700">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">I</span>
                        Incubator
                    </h1>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                pathname.startsWith(item.href)
                                    ? "bg-slate-800 text-white"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-700">
                    <div className="flex items-center gap-3 mb-4 px-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs">
                            {user?.full_name?.charAt(0) || "U"}
                        </div>
                        <div className="text-sm">
                            <p className="font-medium">{user?.full_name || "User"}</p>
                            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-3 py-2 w-full text-slate-400 hover:text-white hover:bg-slate-800 rounded-md text-sm"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 bg-gray-50 dark:bg-zinc-950 flex flex-col">
                {/* Top Header (Mobile Logic could go here) */}
                <header className="h-16 border-b bg-white dark:bg-zinc-900 border-border px-6 flex items-center justify-between md:hidden">
                    <span className="font-bold">Incubator</span>
                    {/* Mobile Menu trigger would go here */}
                </header>

                <div className="p-6 overflow-auto flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
}
