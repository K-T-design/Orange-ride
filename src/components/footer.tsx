
'use client';

import Link from 'next/link';
import { Car } from 'lucide-react';
import { usePathname } from 'next/navigation';

const Logo = () => (
  <Link href="/" className="flex items-center gap-2" prefetch={false}>
    <Car className="h-8 w-8 text-primary" />
    <span className="text-2xl font-bold text-foreground font-headline">Orange Rides</span>
  </Link>
);

export function Footer() {
  const pathname = usePathname();

  // Don't render footer for admin or auth pages
  const authPages = ['/admin', '/login', '/signup', '/customer', '/owner'];
  if (authPages.some(p => pathname.startsWith(p))) {
    return null;
  }

  return (
    <footer className="bg-card border-t mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Logo />
            <p className="text-muted-foreground">
              Your journey, your way. Find the best rides with us.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/search" className="text-muted-foreground hover:text-primary transition-colors" prefetch={false}>
                  Search Rides
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-muted-foreground hover:text-primary transition-colors" prefetch={false}>
                  List a Ride
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-muted-foreground hover:text-primary transition-colors" prefetch={false}>
                  Help Center
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors" prefetch={false}>
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-primary transition-colors" prefetch={false}>
                  Contact
                </Link>
              </li>
               <li>
                <Link href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors" prefetch={false}>
                  Privacy Policy
                </Link>
              </li>
               <li>
                <Link href="/terms-of-service" className="text-muted-foreground hover:text-primary transition-colors" prefetch={false}>
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
               {/* Placeholder for social icons */}
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Facebook" prefetch={false}>
                <FacebookIcon className="h-6 w-6" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Twitter" prefetch={false}>
                <TwitterIcon className="h-6 w-6" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram" prefetch={false}>
                <InstagramIcon className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Orange Rides. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 4s-.7 2.1-2 3.4c1.6 1.4 3.3 4.4 3.3 4.4s-1.4 1.4-2.8 2.1c.1 1.9.1 3.8-.2 5.6-1.2 5.6-6.6 9.6-12.6 9.6-2.5 0-4.8-.7-6.9-2.2 2.8.2 5.5-1.1 7.4-2.9-2.5-.1-4.5-1.8-5.2-4.1 1.2.2 2.3.2 3.3-.4-2.7-.5-4.7-2.9-4.7-5.8v-.1c.8.4 1.7.7 2.6.7-1.6-1.1-2.6-2.9-2.6-5 0-1.1.3-2.2.8-3.1 3 3.6 7.2 5.9 12 6.1v-.2c0-2.8 2.2-5.1 5-5.1.8 0 1.5.3 2.1.8.6-.1 1.2-.3 1.8-.7-.2.7-.7 1.2-1.2 1.6.6-.1 1.1-.2 1.6-.4z" />
    </svg>
  )
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}
