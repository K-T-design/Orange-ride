
'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, Timestamp } from "firebase/firestore";
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Loader2 } from 'lucide-react';
import { plans } from '@/lib/data';
import type { PlanKey } from '@/lib/types';
import { cn } from '@/lib/utils';
import { initializePaymentRedirect } from '@/lib/paystack';

interface Subscription {
  plan: PlanKey;
  status: string;
  expiryDate?: Timestamp;
}

export default function SubscriptionPage() {
  const [user, loadingAuth] = useAuthState(auth);
  const router = useRouter();
  const [activePlan, setActivePlan] = useState<PlanKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<PlanKey | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      const unsub = onSnapshot(doc(db, "subscriptions", user.uid), (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Subscription;
          // Check if subscription is expired
          if (data.status === 'Active' && data.expiryDate && new Date(data.expiryDate.seconds * 1000) < new Date()) {
             setActivePlan(null); // Treat as expired
          } else if (data.status === 'Active') {
             setActivePlan(data.plan);
          } else {
             setActivePlan(null);
          }
        } else {
          setActivePlan(null);
        }
        setIsLoading(false);
      });
      return () => unsub();
    } else if (!loadingAuth) {
      setIsLoading(false);
    }
  }, [user, loadingAuth]);

  const handleSelectPlan = async (planKey: PlanKey) => {
    if (!user || !user.email) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to select a plan.",
      });
      return;
    }
    
    setIsProcessing(planKey);

    try {
      const result = await initializePaymentRedirect(user.email, planKey, user.uid);
      
      if (result.error) {
        throw new Error(result.error);
      }

      if (result.authorization_url) {
        // Redirect user to Paystack's payment page
        router.push(result.authorization_url);
      }

    } catch (error: any) {
        console.error("Payment Initialization Error: ", error);
        toast({ variant: "destructive", title: "Payment Error", description: error.message || "Could not initiate the payment. Please try again." });
        setIsProcessing(null);
    }
  };

  if (isLoading || loadingAuth) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(Object.keys(plans) as PlanKey[]).map((key) => {
            const planKey = key;
            const plan = plans[planKey];
            const isActive = activePlan === planKey;

            return (
                <Card key={planKey} className={cn("flex flex-col", isActive ? "border-green-500 border-2" : "")}>
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">{plan.name}</CardTitle>
                        <p className="text-3xl font-bold">
                            ₦{plan.price.toLocaleString()}
                        </p>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                       <div className="text-center">
                            <p className="font-semibold text-primary">
                                {plan.listings === Infinity ? 'Unlimited' : `Up to ${plan.listings}`} Listings
                            </p>
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
                       <Button
                          onClick={() => handleSelectPlan(planKey)}
                          disabled={isActive || !!isProcessing}
                          className={cn("w-full", isActive && "bg-green-500 hover:bg-green-600 cursor-not-allowed")}
                        >
                          {isProcessing === planKey ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                          {isActive ? (
                            <>
                              <CheckCircle className="mr-2 h-5 w-5" />
                              Subscribed
                            </>
                          ) : (
                            isProcessing === planKey ? 'Processing...' : plan.cta
                          )}
                        </Button>
                    </CardFooter>
                </Card>
            )
        })}
    </div>

    </div>
  );
}
