
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyPayment } from '@/lib/paystack';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type VerificationStatus = 'loading' | 'success' | 'error';

export default function VerifyPaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [message, setMessage] = useState('Please wait while we confirm your transaction.');

  useEffect(() => {
    const reference = searchParams.get('reference');

    if (!reference) {
      setStatus('error');
      setMessage('No payment reference found. You will be redirected shortly.');
      setTimeout(() => router.push('/owner/subscriptions'), 3000);
      return;
    }

    const handleVerification = async () => {
      const result = await verifyPayment(reference);
      
      if (result.success) {
        setStatus('success');
        setMessage(result.message || 'Your subscription has been activated!');
        toast({
          title: 'Payment Successful!',
          description: result.message,
        });
        setTimeout(() => router.push('/owner/subscriptions'), 3000);
      } else {
        setStatus('error');
        setMessage(result.message || 'An unknown error occurred. Please try again.');
        toast({
          variant: 'destructive',
          title: 'Payment Verification Failed',
          description: result.message || 'An unknown error occurred.',
        });
      }
    };

    handleVerification();
  }, [searchParams, router, toast]);
  
  const StatusIcon = () => {
      switch (status) {
          case 'loading':
              return <Loader2 className="h-8 w-8 text-primary animate-spin" />;
          case 'success':
              return <CheckCircle className="h-8 w-8 text-green-500" />;
          case 'error':
              return <XCircle className="h-8 w-8 text-destructive" />;
      }
  }
  
   const StatusTitle = () => {
      switch (status) {
          case 'loading':
              return 'Verifying Your Payment';
          case 'success':
              return 'Payment Successful!';
          case 'error':
              return 'Verification Failed';
      }
  }


  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
            <StatusIcon />
          </div>
          <CardTitle>
            <StatusTitle />
          </CardTitle>
          <CardDescription>
            {message}
          </CardDescription>
        </CardHeader>
        {status !== 'loading' && (
            <CardContent>
                <Button onClick={() => router.push('/owner/subscriptions')}>
                    Return to Subscriptions
                </Button>
            </CardContent>
        )}
      </Card>
    </div>
  );
}
