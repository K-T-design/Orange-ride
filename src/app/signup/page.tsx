
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { Car, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const passwordValidation = z.string().min(8, 'Password must be at least 8 characters.').refine(
  (password) => /^(?=.*[0-9])(?=.*[!@#$%^&*])/.test(password),
  'Password must contain at least one number and one special character.'
);

const customerSchema = z.object({
  role: z.literal('Customer'),
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  phone: z.string().min(10, { message: "Please enter a valid phone number." }),
  password: passwordValidation,
  terms: z.boolean().refine((val) => val === true, { message: "You must accept the terms and conditions." }),
});

const rideOwnerSchema = z.object({
  role: z.literal('Ride Owner'),
  businessName: z.string().min(2, { message: "Business name must be at least 2 characters." }),
  businessType: z.string({ required_error: "Please select a business type." }),
  contactPerson: z.string().min(2, { message: "Contact person must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  phone: z.string().min(10, { message: "Please enter a valid phone number." }),
  password: passwordValidation,
  terms: z.boolean().refine((val) => val === true, { message: "You must accept the terms and conditions." }),
});

const formSchema = z.discriminatedUnion('role', [customerSchema, rideOwnerSchema]);
type FormData = z.infer<typeof formSchema>;

export default function SignUpPage() {
  const [role, setRole] = useState<'Customer' | 'Ride Owner'>('Customer');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: 'Customer',
      terms: false,
    },
  });
  
  const handleRoleChange = (newRole: 'Customer' | 'Ride Owner') => {
    setRole(newRole);
    form.setValue('role', newRole);
    form.reset({ role: newRole, terms: form.getValues('terms') });
  };

  const onSubmit = (values: FormData) => {
    setIsLoading(true);
    console.log(values);
    // Dummy loading state
    setTimeout(() => {
        toast({
            title: "Account Created (Simulated)",
            description: "Your account has been successfully created. You can now sign in.",
        })
        setIsLoading(false);
    }, 2000);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2" prefetch={false}>
            <Car className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground font-headline">Orange Rides</span>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
            <CardDescription>Join us to start your journey.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>I am a...</FormLabel>
                      <Select onValueChange={(value: 'Customer' | 'Ride Owner') => handleRoleChange(value)} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Customer">Customer</SelectItem>
                          <SelectItem value="Ride Owner">Ride Owner</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {role === 'Customer' && (
                  <>
                    <FormField control={form.control} name="fullName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </>
                )}

                {role === 'Ride Owner' && (
                  <>
                    <FormField control={form.control} name="businessName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl><Input placeholder="e.g., City Express" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="businessType" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Business Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value="Transport Company">Transport Company</SelectItem>
                                    <SelectItem value="Individual Driver">Individual Driver</SelectItem>
                                    <SelectItem value="Booking Company">Booking Company</SelectItem>
                                    <SelectItem value="Vehicle Rental Service">Vehicle Rental Service</SelectItem>
                                    <SelectItem value="Taxi Service">Taxi Service</SelectItem>
                                    <SelectItem value="Bus Service">Bus Service</SelectItem>
                                    <SelectItem value="Private Rides Service">Private Rides Service</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                     <FormField control={form.control} name="contactPerson" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl><Input placeholder="e.g., Jane Smith" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </>
                )}

                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input placeholder="2348012345678" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl><Input type="password" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I agree to the <Link href="/terms" className="text-primary hover:underline">Terms & Conditions</Link>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Creating Account...' : 'Sign Up'}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  Already have an account? <Link href="/login" className="text-primary hover:underline">Sign In</Link>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
