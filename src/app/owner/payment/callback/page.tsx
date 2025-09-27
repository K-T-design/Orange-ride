
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyPayment } from '@/lib/paystack';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

function PaymentCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'invalid'>('loading');
  const [message, setMessage] = useState('Verifying your payment, please wait...');

  useEffect(() => {
    const reference = searchParams.get('reference');
    const trxref = searchParams.get('trxref');

    const paymentReference = reference || trxref;

    if (!paymentReference) {
      setMessage('No payment reference found. Your transaction may not have been completed.');
      setStatus('invalid');
      return;
    }

    const verify = async () => {
      const result = await verifyPayment(paymentReference);
      if (result.status === 'success') {
        setStatus('success');
        setMessage(result.message);
      } else {
        setStatus('error');
        setMessage(result.message);
      }
    };

    verify();
  }, [searchParams]);

  const StatusDisplay = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <CardTitle>Processing Payment</CardTitle>
            <CardDescription>{message}</CardDescription>
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="h-16 w-16 text-green-500" />
            <CardTitle>Payment Successful!</CardTitle>
            <CardDescription>{message}</CardDescription>
            <Button asChild className="mt-4">
              <Link href="/owner/dashboard">Go to Dashboard</Link>
            </Button>
          </>
        );
      case 'error':
        return (
          <>
            <XCircle className="h-16 w-16 text-destructive" />
            <CardTitle>Payment Failed</CardTitle>
            <CardDescription>{message}</CardDescription>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/owner/subscriptions">Try Again</Link>
            </Button>
          </>
        );
      case 'invalid':
        return (
          <>
            <AlertTriangle className="h-16 w-16 text-yellow-500" />
            <CardTitle>Invalid Transaction</CardTitle>
            <CardDescription>{message}</CardDescription>
             <Button asChild variant="outline" className="mt-4">
              <Link href="/owner/subscriptions">Return to Subscriptions</Link>
            </Button>
          </>
        );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardContent className="flex flex-col items-center justify-center text-center gap-4 pt-6">
            <StatusDisplay />
          </CardContent>
        </CardHeader>
      </Card>
    </div>
  );
}


export default function PaymentCallbackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PaymentCallback />
        </Suspense>
    )
}
