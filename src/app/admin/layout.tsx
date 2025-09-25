
'use client';

import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Home, Users, Car, CreditCard, Flag, Settings, LogOut, Megaphone, Bell, HelpCircle, Info } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { NotificationsDropdown } from "@/components/admin/notifications-dropdown";

const adminNavLinks = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/owners", label: "Ride Owners", icon: Users },
  { href: "/admin/listings", label: "Listings", icon: Car },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/advertisements", label: "Advertisements", icon: Megaphone },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/faqs", label: "FAQs", icon: HelpCircle },
  { href: "/admin/about", label: "About Us", icon: Info },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

// A helper function to get the page title from the pathname
const getPageTitle = (pathname: string) => {
    if (pathname === '/admin') return 'Dashboard';
    for (const link of adminNavLinks) {
        if (pathname.startsWith(link.href) && link.href !== '/admin' && link.href !== '/') {
            return link.label;
        }
    }
    // Handle nested pages like /admin/listings/add
    if (pathname.startsWith('/admin/listings/')) return 'Listings';
    return 'Admin';
}


export default function AdminLayout({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
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
  
  if (!isClient) {
    return (
        <div className="flex h-screen items-center justify-center">
             <div className="flex flex-col items-center gap-4">
                <Car className="h-12 w-12 animate-pulse text-primary" />
             </div>
        </div>
    );
  }

  return (
    <SidebarProvider>
        <Sidebar>
            <SidebarHeader>
                 <div className="flex items-center gap-2 p-2">
                    <Car className="h-8 w-8 text-primary" />
                    <span className="text-xl font-bold font-headline">Orange Rides</span>
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
            <SidebarContent className="mt-auto">
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
            <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
                <div className="md:hidden">
                    <SidebarTrigger />
                </div>
                <div className="flex w-full items-center gap-4">
                    <h1 className="flex-1 text-2xl font-bold font-headline">{getPageTitle(pathname)}</h1>
                    <NotificationsDropdown />
                </div>
            </header>
            <main className="flex-1 p-4 md:p-8">
                 {children}
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
