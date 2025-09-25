
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, DollarSign, Users, Activity } from "lucide-react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";

export default function OwnerDashboardPage() {
    return (
        <div className="flex min-h-screen flex-col bg-background">
             <header className="sticky top-0 z-40 border-b bg-background">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2">
                         <Car className="h-7 w-7 text-primary" />
                         <span className="text-xl font-bold font-headline">Orange Rides</span>
                    </div>
                    <h1 className="text-xl font-semibold">Owner Dashboard</h1>
                     <Button variant="outline" asChild>
                        <Link href="/">Logout</Link>
                    </Button>
                </div>
            </header>
             <main className="container mx-auto flex-1 p-4 md:p-8">
                 <div className="space-y-8">
                    <div className="text-left">
                        <h2 className="text-3xl font-bold font-headline">Welcome, Ride Owner!</h2>
                        <p className="text-muted-foreground">Here's a summary of your business.</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
                                <Car className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">5</div>
                                <p className="text-xs text-muted-foreground">
                                    +2 since last month
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Monthly Earnings</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₦45,231.89</div>
                                <p className="text-xs text-muted-foreground">
                                    +20.1% from last month
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">+2350</div>
                                <p className="text-xs text-muted-foreground">
                                    +180.1% from last month
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Rides</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">+3</div>
                                <p className="text-xs text-muted-foreground">
                                    +1 since last hour
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Manage Listings</CardTitle>
                                <CardDescription>Add a new vehicle, edit existing ones, or view performance.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild>
                                    <Link href="/owner/listings">Go to My Listings</Link>
                                </Button>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>My Profile & Subscription</CardTitle>
                                <CardDescription>Update your business information and manage your subscription plan.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild>
                                    <Link href="/owner/profile">Go to Profile</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
