'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Placeholder for Firebase Auth
        if (email === 'admin@orangerides.com' && password === 'password') {
            setError('');
            // On successful login, redirect to the admin dashboard
            router.push('/admin');
        } else {
            setError('Invalid email or password.');
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="flex items-center gap-2">
                         <Car className="h-8 w-8 text-primary" />
                         <span className="text-2xl font-bold text-foreground font-headline">Orange Rides</span>
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl font-headline">Admin Login</CardTitle>
                        <CardDescription>Enter your credentials to access the admin panel.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@example.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                            <Button type="submit" className="w-full">
                                Sign In
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}