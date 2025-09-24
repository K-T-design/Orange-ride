
'use client';

import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Home, Users, Car, CreditCard, Flag, Settings, LogOut } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const adminNavLinks = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/owners", label: "Ride Owners", icon: Users },
  { href: "/admin/listings", label: "Listings", icon: Car },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        if (pathname !== '/admin/login') {
          router.push('/admin/login');
        } else {
          setIsLoading(false);
        }
      } else {
        if (pathname === '/admin/login') {
          router.push('/admin');
        } else {
          setIsLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, [router, pathname]);

  const handleLogout = async () => {
    try {
        await signOut(auth);
        toast({
            title: "Logged Out",
            description: "You have been successfully logged out.",
        });
        router.push('/admin/login');
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Logout Failed",
            description: error.message || "An unknown error occurred.",
        })
    }
  };


  if (isLoading) {
    if (pathname === '/admin/login') {
        return <>{children}</>
    }
    return (
        <div className="flex h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Car className="h-12 w-12 animate-pulse text-primary" />
                <p className="text-lg font-semibold">Authenticating...</p>
                <div className="w-64 space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            </div>
        </div>
    );
  }

  if (pathname === '/admin/login') {
      return <>{children}</>;
  }
  
  return (
    <SidebarProvider>
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2 p-2">
                    <Car className="h-8 w-8 text-primary" />
                    <span className="text-xl font-bold font-headline">Orange Rides Admin</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {adminNavLinks.map((link) => (
                        <SidebarMenuItem key={link.label}>
                            <SidebarMenuButton asChild>
                                <a href={link.href}>
                                    <link.icon />
                                    <span>{link.label}</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarContent className="mt-auto flex-col-reverse">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleLogout}>
                            <LogOut />
                            <span>Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
        <SidebarInset>
            <div className="p-4 md:p-8">
                <div className="md:hidden mb-4">
                    <SidebarTrigger />
                </div>
                 {children}
            </div>
        </SidebarInset>
    </SidebarProvider>
  );
}
