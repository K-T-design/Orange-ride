
'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Car, LayoutDashboard, CarIcon, User, LogOut, Loader2, CreditCard, PlusCircle, List } from 'lucide-react';
import Link from 'next/link';

const ownerNavLinks = [
  { href: '/owner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/owner/listings', label: 'My Listings', icon: List },
  { href: '/owner/listings/add', label: 'Add New Listing', icon: PlusCircle },
  { href: '/owner/subscriptions', label: 'Subscription', icon: CreditCard },
  { href: '/owner/profile', label: 'My Profile', icon: User },
];

export default function OwnerLayout({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().role === 'Ride Owner') {
          setUser(user);
          setIsLoading(false);
        } else {
          // Not a ride owner or data doesn't exist, redirect them
          router.push('/');
          toast({ variant: 'destructive', title: 'Access Denied' });
        }
      } else {
        // No user, redirect to login
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router, toast]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      router.push('/login');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: error.message || 'An unknown error occurred.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Car className="h-12 w-12 animate-pulse text-primary" />
          <p className="text-lg font-semibold">Verifying Owner Access...</p>
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-background sm:flex">
        <nav className="flex flex-col gap-4 p-4 sm:py-5">
          <Link
            href="/owner/dashboard"
            className="group flex items-center gap-2 rounded-full p-2 text-lg font-semibold"
          >
            <Car className="h-7 w-7 text-primary transition-all group-hover:scale-110" />
            <span className="font-headline">Orange Rides</span>
          </Link>
          {ownerNavLinks.map((link) => {
            const isActive = pathname.startsWith(link.href) && (link.href !== '/owner/listings' || pathname === '/owner/listings');
            return (
              <Link key={link.label} href={link.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                >
                  <link.icon className="mr-2 h-4 w-4" />
                  {link.label}
                </Button>
              </Link>
            )
          })}
        </nav>
        <nav className="mt-auto flex flex-col gap-4 p-4">
            <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
            </Button>
        </nav>
      </aside>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            {/* Mobile header elements can go here if needed */}
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
        </main>
      </div>
    </div>
  );
}
