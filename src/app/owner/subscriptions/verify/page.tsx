
'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyPayment } from '@/lib/paystack';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function VerifyPaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const reference = searchParams.get('reference');

    if (!reference) {
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: 'No payment reference found.',
      });
      router.push('/owner/subscriptions');
      return;
    }

    const handleVerification = async () => {
      const result = await verifyPayment(reference);
      
      if (result.success) {
        toast({
          title: 'Payment Successful!',
          description: result.message,
        });
        router.push('/owner/subscriptions');
      } else {
        toast({
          variant: 'destructive',
          title: 'Payment Verification Failed',
          description: result.message || 'An unknown error occurred.',
        });
        router.push('/owner/subscriptions');
      }
    };

    handleVerification();
  }, [searchParams, router, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          <CardTitle className="mt-4">Verifying Your Payment</CardTitle>
          <CardDescription>
            Please wait while we confirm your transaction. Do not close this page.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
