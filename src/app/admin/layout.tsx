
'use client';

import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Home, Users, Car, CreditCard, Flag, Settings, LogOut, Megaphone, Bell, HelpCircle, Info, Mail, Send } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { NotificationsDropdown } from "@/components/admin/notifications-dropdown";
import { AdminNotificationsProvider, useAdminNotifications } from "@/context/AdminNotificationsContext";


const navLinksConfig = [
  { href: "/admin", label: "Dashboard", icon: Home, alertKey: null },
  { href: "/admin/owners", label: "Ride Owners", icon: Users, alertKey: "pendingOwners" },
  { href: "/admin/listings", label: "Listings", icon: Car, alertKey: null },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard, alertKey: null },
  { href: "/admin/reports", label: "Reports", icon: Flag, alertKey: "pendingReports" },
  { href: "/admin/messages", label: "Messages", icon: Mail, alertKey: null },
  { href: "/admin/advertisements", label: "Advertisements", icon: Megaphone, alertKey: null },
  { href: "/admin/notifications", label: "Notifications", icon: Bell, alertKey: "unread" },
  { href: "/admin/broadcast", label: "Broadcast", icon: Send, alertKey: null },
  { href: "/admin/faqs", label: "FAQs", icon: HelpCircle, alertKey: null },
  { href: "/admin/about", label: "About Us", icon: Info, alertKey: null },
  { href: "/admin/settings", label: "Settings", icon: Settings, alertKey: null },
];

// A custom hook to manage admin authentication
function useAdminAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If we are on the login page, don't run the auth check.
    const isLoginPage = pathname === '/admin/login';
    if (isLoginPage) {
        setIsLoading(false);
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/admin/login');
        setIsLoading(false);
        return;
      }

      try {
        const idTokenResult = await user.getIdTokenResult(true); // Force refresh
        if (idTokenResult.claims.admin) {
          // User is an admin, allow access
           if (pathname === '/admin/login') {
            router.push('/admin');
          }
          setIsLoading(false);
        } else {
          // User is logged in but not an admin, deny access
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You do not have permission to access the admin panel.",
          });
          signOut(auth); // Sign out the non-admin user
          router.push('/');
        }
      } catch (error) {
          console.error("Error verifying admin token:", error);
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "Could not verify your authentication status.",
          });
          signOut(auth);
          router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router, pathname, toast]);

  return { isLoading };
}


// A helper function to get the page title from the pathname
const getPageTitle = (pathname: string) => {
    if (pathname === '/admin') return 'Dashboard';
    for (const link of navLinksConfig) {
        if (pathname.startsWith(link.href) && link.href !== '/admin' && link.href !== '/') {
            return link.label;
        }
    }
    // Handle nested pages like /admin/listings/add
    if (pathname.startsWith('/admin/listings/')) return 'Listings';
    return 'Admin';
}

function AdminSidebar() {
    const { toast } = useToast();
    const router = useRouter();
    const { unreadCount, hasPendingOwners, hasPendingReports } = useAdminNotifications();
    
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
    
    const alerts = {
        unread: unreadCount > 0,
        pendingOwners: hasPendingOwners,
        pendingReports: hasPendingReports,
    };

    return (
        <Sidebar>
            <SidebarHeader>
                 <div className="flex items-center gap-2 p-2">
                    <Car className="h-8 w-8 text-primary" />
                    <span className="text-xl font-bold font-headline">Orange Rides</span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    {navLinksConfig.map((link) => (
                        <SidebarMenuItem key={link.label} className="relative">
                            <SidebarMenuButton asChild>
                                <a href={link.href}>
                                    <link.icon />
                                    <span>{link.label}</span>
                                </a>
                            </SidebarMenuButton>
                            {link.alertKey && alerts[link.alertKey as keyof typeof alerts] && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-destructive" />
                            )}
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
    );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isLoading } = useAdminAuth();
  const isLoginPage = pathname === '/admin/login';

  if (isLoading && !isLoginPage) {
    return (
        <div className="flex h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Car className="h-12 w-12 animate-pulse text-primary" />
                <p className="text-lg font-semibold">Verifying Admin Access...</p>
                <div className="w-64 space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            </div>
        </div>
    );
  }

  if (isLoginPage) {
      return <>{children}</>;
  }
  
  return (
    <AdminNotificationsProvider>
      <SidebarProvider>
          <AdminSidebar />
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
    </AdminNotificationsProvider>
  );
}
