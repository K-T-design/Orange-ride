
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Car, CircleUser, Menu, Search, PlusCircle, LifeBuoy, LogOut, LayoutDashboard, User } from 'lucide-react';

type UserState = {
  loggedIn: boolean;
  role: 'Customer' | 'Ride Owner' | 'Admin' | null;
  initials: string;
  avatarUrl?: string;
};

const Logo = () => (
  <Link href="/" className="flex items-center gap-2" prefetch={false}>
    <Car className="h-7 w-7 text-primary" />
    <span className="text-xl font-bold text-foreground font-headline">Orange Rides</span>
  </Link>
);

const NavLink = ({ href, label }: { href: string; label: string }) => {
    const pathname = usePathname();
    const isActive = pathname === href;
    return (
        <Link href={href} passHref prefetch={false}>
            <Button variant="ghost" className={cn("justify-start", isActive && "bg-accent text-accent-foreground")}>
                {label}
            </Button>
        </Link>
    );
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [userState, setUserState] = useState<UserState | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Simplified Admin check for this demo
        const adminEmails = ['admin@example.com', 'superadmin@example.com'];
        if (adminEmails.includes(user.email ?? '')) {
            setUserState({ loggedIn: true, role: 'Admin', initials: 'A' });
            return;
        }
        
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        let role: UserState['role'] = null;
        let initials = 'U';
        let avatarUrl = undefined;
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          role = userData.role; // 'Customer' or 'Ride Owner'
          if (userData.fullName) {
            initials = userData.fullName.charAt(0).toUpperCase();
          }
          if (userData.profilePicture) {
            avatarUrl = userData.profilePicture;
          }
        }

        setUserState({ loggedIn: true, role, initials, avatarUrl });
      } else {
        setUserState({ loggedIn: false, role: null, initials: 'G' });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
        await signOut(auth);
        toast({ title: "Logged Out" });
        router.push('/'); // Redirect to homepage after logout
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Logout Failed" });
    }
  };
  
  // Don't render header for admin pages (they have their own layout)
  if (pathname.startsWith('/admin')) {
    return null;
  }
  
  const getDashboardUrl = () => {
      if (userState?.role === 'Ride Owner') return '/owner/dashboard';
      if (userState?.role === 'Customer') return '/customer/home';
      // Admin does not have a dashboard link in this header
      return '/login';
  }

  const navLinks = [
    { href: '/search', label: 'Search', icon: Search },
    ...(userState?.role === 'Ride Owner' ? [{ href: '/owner/listings/add', label: 'List a Ride', icon: PlusCircle }] : []),
    { href: '/help', label: 'Help', icon: LifeBuoy },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
            <Logo />
        </div>
        
        <div className="md:hidden">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left">
                    <div className="py-6">
                        <Logo />
                    </div>
                    <nav className="grid gap-2">
                        {navLinks.map((link) => (
                           <Link key={link.label} href={link.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary" prefetch={false}>
                                <link.icon className="h-4 w-4" />
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </SheetContent>
            </Sheet>
        </div>

        <div className="flex w-full items-center justify-between md:justify-center">
            <div className="hidden md:flex items-center gap-4 text-sm">
                {navLinks.map((link) => (
                    <NavLink key={link.label} href={link.href} label={link.label} />
                ))}
            </div>
            <div className="md:hidden">
                <Logo />
            </div>
        </div>


        <div className="flex items-center justify-end gap-4 ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage src={userState?.avatarUrl} />
                  <AvatarFallback>
                    {userState ? userState.initials : <CircleUser />}
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {userState?.loggedIn ? (
                <>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {userState.role !== 'Admin' && (
                    <DropdownMenuItem asChild>
                      <Link href={getDashboardUrl()}><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</Link>
                    </DropdownMenuItem>
                  )}
                   {userState.role !== 'Admin' && (
                    <DropdownMenuItem asChild>
                      <Link href={userState.role === 'Ride Owner' ? '/owner/profile' : '/customer/profile'}><User className="mr-2 h-4 w-4" /> Profile</Link>
                    </DropdownMenuItem>
                  )}
                  {userState.role !== 'Admin' && <DropdownMenuSeparator />}
                  <DropdownMenuItem onSelect={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/login">Sign In / Sign Up</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
