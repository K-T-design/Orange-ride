import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Home, Users, Car, CreditCard, Flag, Settings } from "lucide-react";
import { ReactNode } from "react";

const adminNavLinks = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/owners", label: "Ride Owners", icon: Users },
  { href: "/admin/listings", label: "Listings", icon: Car },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  // For now, we'll wrap the children in a simple div.
  // In the future, we will add authentication checks here.
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