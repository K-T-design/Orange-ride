
'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { usePaystackPayment } from 'react-paystack';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Zap, Crown, Loader2 } from 'lucide-react';
import { plans } from '@/lib/data';
import { initializePayment, verifyPayment } from '@/lib/paystack';

type PlanKey = keyof typeof plans;

export default function SubscriptionPage() {
  const [user, loadingAuth] = useAuthState(auth);
  const [currentPlan, setCurrentPlan] = useState<PlanKey>('None');
  const [listingCount, setListingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState<PlanKey | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const ownerDocRef = doc(db, 'rideOwners', user.uid);
      const unsubOwner = onSnapshot(ownerDocRef, (doc) => {
        const data = doc.data();
        setCurrentPlan(data?.plan as PlanKey || 'None');
        setIsLoading(false);
      });

      const listingsQuery = query(collection(db, 'listings'), where('ownerId', '==', user.uid));
      const unsubListings = onSnapshot(listingsQuery, (snapshot) => {
        setListingCount(snapshot.size);
      });

      return () => {
        unsubOwner();
        unsubListings();
      };
    } else if (!loadingAuth) {
      setIsLoading(false);
    }
  }, [user, loadingAuth]);

  const paystackConfig = {
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
    email: user?.email || '',
  };

  const initializePaystack = usePaystackPayment(paystackConfig);

  const handleSelectPlan = async (planKey: PlanKey) => {
    if (!user || planKey === currentPlan) return;
    
    setIsProcessingPayment(planKey);
    try {
      const response = await initializePayment(planKey, user.uid);
      
      if (response.status && response.data) {
        const paymentConfig = {
            ...paystackConfig,
            amount: plans[planKey].price * 100,
            reference: response.data.reference,
            onSuccess: (transaction: any) => {
                toast({ title: "Payment Successful!", description: `Reference: ${transaction.reference}. Your plan will be updated shortly.`});
                // We rely on the webhook for activation, but can trigger a client-side verification as a fallback
                verifyPayment(transaction.reference);
            },
            onClose: () => {
                toast({ variant: 'destructive', title: 'Payment cancelled.' });
            },
        };
        initializePaystack(paymentConfig);
      } else {
        throw new Error(response.message || 'Failed to initialize payment.');
      }
    } catch (error: any) {
        console.error("Error initializing payment: ", error);
        toast({
            variant: 'destructive',
            title: 'Payment Error',
            description: error.message || 'Could not start the payment process. Please try again.',
        });
    } finally {
        setIsProcessingPayment(null);
    }
  };

  const currentPlanDetails = plans[currentPlan];
  const usagePercentage = currentPlanDetails.listings > 0 && currentPlanDetails.listings !== Infinity 
    ? (listingCount / currentPlanDetails.listings) * 100 
    : 0;

  if (isLoading || loadingAuth) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Subscription & Billing</h1>
        <p className="text-muted-foreground">Manage your plan to add more vehicle listings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Current Plan</CardTitle>
          <CardDescription>This is your active subscription and usage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                    <Badge variant={currentPlan === 'None' ? 'destructive' : 'default'} className="text-lg">
                        {currentPlanDetails.name}
                    </Badge>
                    <p className="text-muted-foreground mt-1">
                        {currentPlan === 'None' ? 'Upgrade to add listings.' : `You can add up to ${currentPlanDetails.listings === Infinity ? 'unlimited' : currentPlanDetails.listings} listings.`}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold">{listingCount} <span className="text-base font-normal text-muted-foreground">/ {currentPlanDetails.listings === Infinity ? '∞' : currentPlanDetails.listings}</span></p>
                    <p className="text-sm text-muted-foreground">Listings Used</p>
                </div>
            </div>
            {currentPlan !== 'None' && currentPlanDetails.listings !== Infinity && (
                <div>
                    <Progress value={usagePercentage} className="w-full" />
                    <p className="text-xs text-muted-foreground text-right mt-1">{usagePercentage.toFixed(0)}% of limit used</p>
                </div>
            )}
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-bold font-headline text-center">Choose Your Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(plans).filter(([key]) => key !== 'None').map(([key, plan]) => {
                const isCurrent = currentPlan === key;
                const planKey = key as PlanKey;
                return (
                    <Card key={key} className={`flex flex-col ${isCurrent ? 'border-primary border-2' : ''}`}>
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl">{plan.name}</CardTitle>
                            <p className="text-3xl font-bold">₦{plan.price.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/{key === 'Weekly' ? 'wk' : key === 'Monthly' ? 'mo' : 'yr'}</span></p>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-4">
                           <div className="text-center">
                                <p className="font-semibold text-primary">{plan.listings === Infinity ? 'Unlimited' : `Up to ${plan.listings}`} Listings</p>
                           </div>
                           <ul className="space-y-2 text-sm text-muted-foreground">
                            {plan.features.map(feature => (
                                <li key={feature} className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0"/>
                                    <span>{feature}</span>
                                </li>
                            ))}
                           </ul>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" onClick={() => handleSelectPlan(planKey)} disabled={isCurrent || isProcessingPayment !== null}>
                                {isProcessingPayment === planKey ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Initializing...</>
                                ) : isCurrent ? 'Current Plan' : plan.cta}
                            </Button>
                        </CardFooter>
                    </Card>
                )
            })}
        </div>
      </div>

    </div>
  );
}
