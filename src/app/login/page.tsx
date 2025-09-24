
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// Hardcoded admin UID for demo purposes
const ADMIN_UID = 'XgQfA6sCVThsWw2g4iJpYc3F5yG3';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (user.uid === ADMIN_UID) {
                 router.push('/admin');
                 return;
            }
            
            // Check user role from Firestore
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                toast({
                    title: "Login Successful",
                    description: `Welcome back, ${userData.role}!`,
                });
                // Redirect based on role
                if (userData.role === 'Ride Owner') {
                    router.push('/owner/dashboard');
                } else if (userData.role === 'Customer') {
                    router.push('/customer/home'); 
                } else {
                    router.push('/'); // Default redirect
                }
            } else {
                // Should not happen if signup is correct
                toast({ variant: 'destructive', title: "User data not found." });
                router.push('/');
            }

        } catch (error: any) {
            console.error("Login Error:", error);
            let errorMessage = "An unknown error occurred.";
            switch(error.code) {
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    errorMessage = "Invalid email or password.";
                    break;
                case 'auth/invalid-email':
                    errorMessage = "Please enter a valid email address.";
                    break;
            }
            toast({
                variant: 'destructive',
                title: "Login Failed",
                description: errorMessage,
            })
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordReset = () => {
        if (!email) {
            toast({
                variant: "destructive",
                title: "Email Required",
                description: "Please enter your email address to reset your password.",
            });
            return;
        }

        sendPasswordResetEmail(auth, email)
            .then(() => {
                toast({
                    title: "Password Reset Email Sent",
                    description: `If an account exists for ${email}, a password reset link has been sent.`,
                });
            })
            .catch((error) => {
                toast({
                    variant: "destructive",
                    title: "Failed to Send Reset Email",
                    description: error.message,
                });
            });
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <Link href="/" className="flex items-center gap-2" prefetch={false}>
                         <Car className="h-8 w-8 text-primary" />
                         <span className="text-2xl font-bold text-foreground font-headline">Orange Rides</span>
                    </Link>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl font-headline">Sign In</CardTitle>
                        <CardDescription>Welcome back! Please enter your details.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
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
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(Boolean(checked))} />
                                    <Label htmlFor="remember-me" className="text-sm font-normal">Remember me</Label>
                                </div>
                                <Button variant="link" type="button" onClick={handlePasswordReset} className="px-0 text-sm h-auto">
                                    Forgot Password?
                                </Button>
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? 'Signing In...' : 'Sign In'}
                            </Button>
                        </form>

                         <div className="mt-4 text-center text-sm">
                            Don't have an account?{' '}
                            <Link href="/signup" className="underline">
                                Sign up
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
