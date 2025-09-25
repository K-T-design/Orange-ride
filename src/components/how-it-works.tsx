
'use client';

import { Search, CheckCircle, Phone, UserPlus, CreditCard, Car } from "lucide-react";

export function HowItWorks() {
    return (
        <section className="py-16">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl font-bold font-headline mb-4">How It Works</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto mb-12">Getting on your way has never been easier. Follow these simple steps to find your next ride.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Search className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-semibold">1. Search for a Ride</h3>
                        <p className="text-muted-foreground">Enter your pickup and destination to browse a wide variety of available vehicles.</p>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <CheckCircle className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-semibold">2. Choose the Best Fit</h3>
                        <p className="text-muted-foreground">Compare prices, schedules, and vehicle types to find the perfect ride for your needs.</p>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Phone className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-semibold">3. Contact the Owner</h3>
                        <p className="text-muted-foreground">Connect directly with the ride owner via phone or WhatsApp to finalize details.</p>
                    </div>
                </div>
            </div>
        </section>
    )
}
