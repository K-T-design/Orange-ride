
'use client';

import Link from 'next/link';
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
import { Car, CircleUser, Menu, Search, PlusCircle, LifeBuoy } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const Logo = () => (
  <Link href="/" className="flex items-center gap-2" prefetch={false}>
    <Car className="h-7 w-7 text-primary" />
    <span className="text-xl font-bold text-foreground font-headline">Orange Rides</span>
  </Link>
);

const navLinks = [
  { href: '/search', label: 'Search', icon: Search },
  { href: '/list-ride', label: 'List a Ride', icon: PlusCircle },
  { href: '/help', label: 'Help', icon: LifeBuoy },
];

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

  // Don't render header for admin or auth pages
  const authPages = ['/admin', '/login', '/signup', '/customer', '/owner'];
  if (authPages.some(p => pathname.startsWith(p))) {
    return null;
  }

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
                  <AvatarImage src="https://picsum.photos/seed/user-avatar/40/40" />
                  <AvatarFallback>
                    <CircleUser />
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/login">Sign In</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/signup">Sign Up</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
