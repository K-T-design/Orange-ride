'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Zap, Crown } from 'lucide-react';

const plans = {
  None: { name: 'No Plan', price: 0, listings: 0, features: ['Cannot add listings'], cta: 'Choose a Plan' },
  Weekly: { name: 'Weekly', price: 10000, listings: 9, features: ['Up to 9 vehicle listings', 'Basic support'], cta: 'Upgrade to Weekly' },
  Monthly: { name: 'Monthly', price: 30000, listings: 50, features: ['Up to 50 vehicle listings', 'Priority support', 'Featured listing opportunities'], cta: 'Upgrade to Monthly' },
  Yearly: { name: 'Yearly', price: 120000, listings: Infinity, features: ['Unlimited vehicle listings', '24/7 dedicated support', 'Top placement in search'], cta: 'Upgrade to Yearly' },
};

type PlanKey = keyof typeof plans;

export default function SubscriptionPage() {
  const [user, loadingAuth] = useAuthState(auth);
  const [currentPlan, setCurrentPlan] = useState<PlanKey>('None');
  const [listingCount, setListingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      // Listen for subscription plan changes
      const ownerDocRef = doc(db, 'rideOwners', user.uid);
      const unsubOwner = onSnapshot(ownerDocRef, (doc) => {
        const data = doc.data();
        if (data && data.plan && Object.keys(plans).includes(data.plan)) {
          setCurrentPlan(data.plan as PlanKey);
        } else {
          setCurrentPlan('None');
        }
        setIsLoading(false);
      });

      // Listen for listing count changes
      const listingsQuery = query(collection(db, 'listings'), where('ownerId', '==', user.uid));
      const unsubListings = onSnapshot(listingsQuery, (snapshot) => {
        setListingCount(snapshot.size);
      });

      return () => {
        unsubOwner();
        unsubListings();
      };
    } else if (!loadingAuth) {
      // Handle case where user is not logged in but auth is not loading
      setIsLoading(false);
    }
  }, [user, loadingAuth]);

  const handleSelectPlan = async (planKey: PlanKey) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'You must be logged in.' });
        return;
    }
    if (planKey === currentPlan) return;
    
    // In a real app, this would trigger a Paystack payment flow.
    // For this demo, we'll just update the plan in Firestore.
    
    const ownerDocRef = doc(db, 'rideOwners', user.uid);
    try {
        await updateDoc(ownerDocRef, { plan: planKey });
        toast({
            title: 'Subscription Updated!',
            description: `You are now on the ${plans[planKey].name} plan.`,
        });
    } catch (error) {
        console.error("Error updating plan: ", error);
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: 'Could not update your subscription plan. Please try again.',
        });
    }
  };

  const currentPlanDetails = plans[currentPlan];
  const usagePercentage = currentPlanDetails.listings > 0 ? (listingCount / currentPlanDetails.listings) * 100 : 0;

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
                            <Button className="w-full" onClick={() => handleSelectPlan(key as PlanKey)} disabled={isCurrent}>
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