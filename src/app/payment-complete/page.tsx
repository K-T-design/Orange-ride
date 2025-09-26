
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default function PaymentCompletePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect user after a few seconds to their subscriptions page
    const timer = setTimeout(() => {
      router.push('/owner/subscriptions');
    }, 5000); // 5 seconds

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="mt-4">Payment Submitted!</CardTitle>
          <CardDescription>
            Thank you for your payment. We are now verifying the transaction.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 animate-spin" />
                <span>Your subscription will be updated shortly.</span>
            </div>
            <p className="text-xs text-muted-foreground">
                You will be redirected automatically. If nothing happens, click the button below.
            </p>
            <Button asChild className="w-full">
                <Link href="/owner/subscriptions">Go to My Subscriptions</Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
