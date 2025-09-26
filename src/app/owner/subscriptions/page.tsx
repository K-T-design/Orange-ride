
'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Crown, Loader2, Calendar } from 'lucide-react';
import { plans } from '@/lib/data';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import type { PlanKey } from '@/lib/types';


type SubscriptionInfo = {
  plan: PlanKey;
  status: 'Active' | 'Expired' | 'Suspended' | 'None';
  expiryDate: Date | null;
}

export default function SubscriptionPage() {
  const [user, loadingAuth] = useAuthState(auth);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [listingCount, setListingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      // Listener for subscription info
      const subsQuery = query(collection(db, 'subscriptions'), where('ownerId', '==', user.uid));
      const unsubSubs = onSnapshot(subsQuery, (snapshot) => {
        if (!snapshot.empty) {
          const subData = snapshot.docs[0].data();
          setSubscription({
            plan: subData.plan as PlanKey || 'None',
            status: subData.status,
            expiryDate: subData.expiryDate ? subData.expiryDate.toDate() : null
          });
        } else {
          setSubscription({ plan: 'None', status: 'None', expiryDate: null });
        }
        setIsLoading(false);
      });

      // Listener for listings count
      const listingsQuery = query(collection(db, 'listings'), where('ownerId', '==', user.uid));
      const unsubListings = onSnapshot(listingsQuery, (snapshot) => {
        setListingCount(snapshot.size);
      });

      return () => {
        unsubSubs();
        unsubListings();
      };
    } else if (!loadingAuth) {
      setIsLoading(false);
    }
  }, [user, loadingAuth]);

  
  const currentPlanKey = subscription?.plan || 'None';
  const currentPlanDetails = plans[currentPlanKey];
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-muted/50 rounded-lg gap-4">
                <div>
                    <Badge variant={currentPlanKey === 'None' ? 'destructive' : 'default'} className="text-lg">
                        {currentPlanDetails.name}
                    </Badge>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {currentPlanKey === 'None' ? 'Upgrade to add listings.' : `You can add up to ${currentPlanDetails.listings === Infinity ? 'unlimited' : currentPlanDetails.listings} listings.`}
                    </p>
                </div>
                 <div className="text-left sm:text-right">
                    <p className="text-2xl font-bold">{listingCount} <span className="text-base font-normal text-muted-foreground">/ {currentPlanDetails.listings === Infinity ? '∞' : currentPlanDetails.listings}</span></p>
                    <p className="text-sm text-muted-foreground">Listings Used</p>
                </div>
                {subscription?.expiryDate && (
                    <div className="text-left sm:text-right">
                        <div className="flex items-center gap-2 font-semibold">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                             <span>Expires on</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{format(subscription.expiryDate, 'PPP')}</p>
                    </div>
                )}
            </div>
            {currentPlanKey !== 'None' && currentPlanDetails.listings !== Infinity && (
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
                const isCurrent = currentPlanKey === key;
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
                            <Button className="w-full" disabled={isCurrent}>
                                {isCurrent ? 'Current Plan' : plan.cta}
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
