
'use client';

import { Search, CheckCircle, Phone, UserPlus, CreditCard, Car } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

const customerSteps = [
    {
        icon: <Search className="h-8 w-8" />,
        title: "1. Search for a Ride",
        description: "Enter your pickup and destination to browse a wide variety of available vehicles."
    },
    {
        icon: <CheckCircle className="h-8 w-8" />,
        title: "2. Choose the Best Fit",
        description: "Compare prices, schedules, and vehicle types to find the perfect ride for your needs."
    },
    {
        icon: <Phone className="h-8 w-8" />,
        title: "3. Contact the Owner",
        description: "Connect directly with the ride owner via phone or WhatsApp to finalize details."
    }
];

const ownerSteps = [
    {
        icon: <UserPlus className="h-8 w-8" />,
        title: "1. Create an Account",
        description: "Sign up as a Ride Owner and get your business profile approved by our team."
    },
    {
        icon: <CreditCard className="h-8 w-8" />,
        title: "2. Choose a Subscription",
        description: "Select a weekly, monthly, or yearly plan to unlock your listing slots."
    },
    {
        icon: <Car className="h-8 w-8" />,
        title: "3. Add Your Vehicles",
        description: "List your vehicles with detailed information and photos for customers to see."
    }
];


export function HowItWorks() {
    return (
        <section>
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold font-headline">How It Works</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">A simple guide to getting started on Orange Rides, whether you're looking for a ride or offering one.</p>
            </div>
             <Tabs defaultValue="customer" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
                    <TabsTrigger value="customer">For Customers</TabsTrigger>
                    <TabsTrigger value="owner">For Ride Owners</TabsTrigger>
                </TabsList>
                <TabsContent value="customer" className="mt-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {customerSteps.map((step, index) => (
                             <div key={index} className="flex flex-col items-center text-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                    {step.icon}
                                </div>
                                <h3 className="text-xl font-semibold">{step.title}</h3>
                                <p className="text-muted-foreground">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </TabsContent>
                <TabsContent value="owner" className="mt-8">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {ownerSteps.map((step, index) => (
                             <div key={index} className="flex flex-col items-center text-center gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                    {step.icon}
                                </div>
                                <h3 className="text-xl font-semibold">{step.title}</h3>
                                <p className="text-muted-foreground">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </section>
    )
}
