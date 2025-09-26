
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
  .refine((password) => /[a-z]/.test(password), 'Password must contain at least one lowercase letter.')
  .refine((password) => /[A-Z]/.test(password), 'Password must contain at least one uppercase letter.')
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


// --- Login Component ---
function LoginForm({ onSuccessfulSignup }: { onSuccessfulSignup: () => void }) {
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
      
      const idTokenResult = await user.getIdTokenResult();
      // Securely check for admin custom claim
      if (idTokenResult.claims.admin) {
         toast({ title: 'Admin Login Successful' });
         router.push('/admin'); // Redirect admins to admin dashboard
         return;
      }

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        toast({
          title: 'Login Successful',
          description: `Welcome back!`,
        });
        // Redirect non-admin users to their respective dashboards or homepage
        const role = userDoc.data().role;
        if (role === 'Ride Owner') {
            router.push('/owner/dashboard');
        } else {
            router.push('/');
        }
      } else {
        // This case should ideally not happen if signup is done correctly
        await auth.signOut();
        toast({ variant: 'destructive', title: 'User data not found. Please sign up again.' });
        onSuccessfulSignup(); // Switch to signup tab
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
            className="px-0 text-sm h-auto font-normal text-muted-foreground hover:text-primary"
          >
            Forgot Password?
          </Button>
        </div>
        <Button
          type="submit"
          className="w-full"
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
function SignupForm({ onSuccessfulSignup }: { onSuccessfulSignup: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<'Customer' | 'Ride Owner'>('Customer');
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
    form.setValue('role', newRole, { shouldValidate: true });
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
      
      const userDocRef = doc(db, 'users', user.uid);

      if (values.role === 'Ride Owner') {
        const ownerDocRef = doc(db, 'rideOwners', user.uid);
        const notificationRef = collection(db, 'notifications');
        
        await Promise.all([
            setDoc(userDocRef, {
                ...userData,
                businessName: values.businessName,
                businessType: values.businessType,
            }),
            setDoc(ownerDocRef, {
                name: values.businessName,
                businessType: values.businessType,
                contactPerson: values.fullName,
                contact: values.email,
                plan: 'None',
                status: 'Pending Approval',
                createdAt: serverTimestamp(),
            }),
            addDoc(notificationRef, {
                message: `New ride owner '${values.businessName}' signed up and needs approval.`,
                ownerName: values.businessName,
                eventType: 'new_owner',
                createdAt: serverTimestamp(),
                read: false,
            })
        ]);
        
      } else {
        await setDoc(userDocRef, userData);
      }

      toast({
        title: 'Account Created!',
        description: 'Your account has been successfully created. Please sign in.',
      });
      onSuccessfulSignup(); // Switch to the sign-in tab

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
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger
          value="Customer"
        >
          I'm a Customer
        </TabsTrigger>
        <TabsTrigger
          value="Ride Owner"
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
                  <Input placeholder="John Doe" {...field} />
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
                        <SelectTrigger>
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
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="font-normal">Accept terms and conditions</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    You agree to our Terms of Service and Privacy Policy.
                  </p>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2">
            <Car className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold font-headline">Orange Rides</span>
          </Link>
        </div>
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
                <CardDescription>
                  Sign in to continue to your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LoginForm onSuccessfulSignup={() => setActiveTab('signin')} />
              </CardContent>
            </TabsContent>
            <TabsContent value="signup">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
                <CardDescription>
                  Join our platform to find or list rides.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SignupForm onSuccessfulSignup={() => setActiveTab('signin')} />
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
