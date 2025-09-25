'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Car, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// --- Login Schema ---
const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

// --- Signup Schemas ---
const passwordValidation = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .refine((password) => /[0-9]/.test(password), 'Password must contain at least one number.')
  .refine(
    (password) => /[!@#$%^&*]/.test(password),
    'Password must contain at least one special character.'
  );

const baseSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email.'),
  phone: z.string().min(10, 'Please enter a valid phone number.'),
  password: passwordValidation,
  confirmPassword: z.string(),
  terms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions.',
  }),
});

const customerSchema = baseSchema.extend({
  role: z.literal('Customer'),
});

const rideOwnerSchema = baseSchema.extend({
  role: z.literal('Ride Owner'),
  businessName: z.string().min(2, 'Business name is required.'),
  businessType: z.string({ required_error: 'Please select a business type.' }),
});

const signupSchema = z.discriminatedUnion('role', [customerSchema, rideOwnerSchema]).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  }
);

type SignupFormData = z.infer<typeof signupSchema>;

// Hardcoded admin UID for demo purposes
const ADMIN_UID = 'XgQfA6sCVThsWw2g4iJpYc3F5yG3';

// --- Login Component ---
function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const handleLogin = async (values: LoginFormData) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      if (user.uid === ADMIN_UID) {
        toast({ title: 'Admin Login Successful' });
        router.push('/admin');
        return;
      }

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role;
        toast({
          title: 'Login Successful',
          description: `Welcome back!`,
        });

        if (role === 'Ride Owner') {
          router.push('/owner/dashboard');
        } else if (role === 'Customer') {
          router.push('/customer/home');
        } else {
          router.push('/'); // Fallback
        }
      } else {
        await auth.signOut();
        toast({ variant: 'destructive', title: 'User data not found. Please contact support.' });
      }
    } catch (error: any) {
      let errorMessage = 'An unknown error occurred. Please check your internet connection.';
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed login attempts. Please try again later.';
          break;
      }
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = () => {
    const email = form.getValues('email');
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'Email Required',
        description: 'Please enter your email address to reset your password.',
      });
      return;
    }

    setIsLoading(true);
    sendPasswordResetEmail(auth, email)
      .then(() => {
        toast({
          title: 'Password Reset Email Sent',
          description: `If an account exists for ${email}, a password reset link has been sent.`,
        });
      })
      .catch(() => {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to send password reset email.',
        });
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className="bg-white border-black/20 focus:ring-black"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="bg-white border-black/20 focus:ring-black"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center justify-between">
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    className="border-black/40"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-normal">Remember Me</FormLabel>
                </div>
              </FormItem>
            )}
          />
          <Button
            variant="link"
            type="button"
            onClick={handlePasswordReset}
            className="px-0 text-sm h-auto font-normal text-black hover:underline"
          >
            Forgot Password?
          </Button>
        </div>
        <Button
          type="submit"
          className="w-full bg-black text-white hover:bg-black/80"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign In
        </Button>
      </form>
    </Form>
  );
}

// --- Signup Component ---
function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<'Customer' | 'Ride Owner'>('Customer');
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: 'Customer',
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });

  const handleTabChange = (value: string) => {
    const newRole = value as 'Customer' | 'Ride Owner';
    setRole(newRole);
    form.setValue('role', newRole);
    if (newRole === 'Customer') {
      form.unregister('businessName');
      form.unregister('businessType');
    }
  };

  const onSubmit = async (values: SignupFormData) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      let userData: any = {
        uid: user.uid,
        email: values.email,
        phone: values.phone,
        fullName: values.fullName,
        role: values.role,
        createdAt: serverTimestamp(),
      };

      if (values.role === 'Ride Owner') {
        await setDoc(doc(db, 'users', user.uid), {
          ...userData,
          businessName: values.businessName,
          businessType: values.businessType,
        });

        await setDoc(doc(db, 'rideOwners', user.uid), {
          name: values.businessName,
          contactPerson: values.fullName,
          contact: values.email,
          plan: 'None',
          status: 'Pending Approval',
          createdAt: serverTimestamp(),
        });

        await addDoc(collection(db, 'notifications'), {
          message: `New ride owner '${values.businessName}' signed up and needs approval.`,
          ownerName: values.businessName,
          eventType: 'new_owner',
          createdAt: serverTimestamp(),
          read: false,
        });
      } else {
        await setDoc(doc(db, 'users', user.uid), userData);
      }

      toast({
        title: 'Account Created!',
        description: 'Your account has been successfully created. Please sign in.',
      });
      // Switch to login tab after successful signup
      // This part is tricky as we need to communicate between components.
      // For now, we will just show a toast. A global state manager would be better.
    } catch (error: any) {
      let errorMessage = 'An unknown error occurred. Check your internet connection.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already in use.';
      }
      toast({
        variant: 'destructive',
        title: 'Sign-up Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tabs value={role} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-gray-200">
        <TabsTrigger
          value="Customer"
          className="data-[state=active]:bg-black data-[state=active]:text-white"
        >
          I'm a Customer
        </TabsTrigger>
        <TabsTrigger
          value="Ride Owner"
          className="data-[state=active]:bg-black data-[state=active]:text-white"
        >
          I'm a Ride Owner
        </TabsTrigger>
      </TabsList>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {role === 'Customer' ? 'Full Name' : 'Contact Person Full Name'}
                </FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} className="bg-white border-black/20 focus:ring-black" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {role === 'Ride Owner' && (
            <>
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., City Express"
                        {...field}
                        className="bg-white border-black/20 focus:ring-black"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white border-black/20 focus:ring-black">
                          <SelectValue placeholder="Select your business type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Transport Company">Transport Company</SelectItem>
                        <SelectItem value="Individual Driver">Individual Driver</SelectItem>
                        <SelectItem value="Booking Company">Booking Company</SelectItem>
                        <SelectItem value="Vehicle Rental Service">Vehicle Rental Service</SelectItem>
                        <SelectItem value="Taxi Service">Taxi Service</SelectItem>
                        <SelectItem value="Bus Service">Bus Service</SelectItem>
                        <SelectItem value="Private Rides Service">Private Rides Service</SelectItem>
                        <SelectItem value="Shuttle Service">Shuttle Service</SelectItem>
                        <SelectItem value="Logistics Service">Logistics Service</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    {...field}
                    className="bg-white border-black/20 focus:ring-black"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="2348012345678"
                    {...field}
                    className="bg-white border-black/20 focus:ring-black"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...field}
                    className="bg-white border-black/20 focus:ring-black"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...field}
                    className="bg-white border-black/20 focus:ring-black"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="terms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-black/20 p-4">
                <FormControl>
                  <Checkbox
                    className="border-black/40"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-normal">Accept terms and conditions</FormLabel>
                  <p className="text-sm text-black/60">
                    You agree to our Terms of Service and Privacy Policy.
                  </p>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full bg-black text-white hover:bg-black/80"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </form>
      </Form>
    </Tabs>
  );
}

// --- Main Page Component ---
export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('signin');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-12 text-black">
      <div className="mx-auto w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2 text-black">
            <Car className="h-8 w-8 text-black" />
            <span className="text-2xl font-bold font-headline">Orange Rides</span>
          </Link>
        </div>
        <Card className="bg-white border-black/20">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
                <CardDescription className="text-black/60">
                  Sign in to continue to your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LoginForm />
              </CardContent>
            </TabsContent>
            <TabsContent value="signup">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
                <CardDescription className="text-black/60">
                  Join our platform to find or list rides.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SignupForm />
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}