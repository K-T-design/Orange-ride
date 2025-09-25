'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, UploadCloud, User as UserIcon } from 'lucide-react';

const profileFormSchema = z.object({
  fullName: z.string().min(2, 'Contact person name must be at least 2 characters.'),
  businessName: z.string().min(2, 'Business name is required.'),
  businessType: z.string({ required_error: 'Please select a business type.' }),
  phone: z.string().min(10, 'Please enter a valid phone number.'),
  email: z.string().email('Please enter a valid email.'),
  profilePicture: z.any().optional(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const [user, loadingAuth] = useAuthState(auth);
  const [initialData, setInitialData] = useState<Partial<ProfileFormData> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: '',
      businessName: '',
      businessType: '',
      phone: '',
      email: '',
    },
  });

  useEffect(() => {
    if (user) {
      const fetchProfileData = async () => {
        setIsLoading(true);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const ownerDocRef = doc(db, 'rideOwners', user.uid);

          const [userDoc, ownerDoc] = await Promise.all([
            getDoc(userDocRef),
            getDoc(ownerDocRef),
          ]);

          if (userDoc.exists() && ownerDoc.exists()) {
            const userData = userDoc.data();
            const ownerData = ownerDoc.data();
            const data = {
              fullName: userData.fullName || '',
              businessName: ownerData.name || '',
              businessType: ownerData.businessType || '',
              phone: userData.phone || '',
              email: userData.email || '',
              profilePicture: userData.profilePicture || null,
            };
            setInitialData(data);
            form.reset(data);
            if(data.profilePicture) {
              setCurrentAvatarUrl(data.profilePicture);
              setImagePreview(data.profilePicture);
            }
          }
        } catch (error) {
          console.error("Error fetching profile data:", error);
          toast({ variant: 'destructive', title: 'Failed to load profile data.' });
        } finally {
          setIsLoading(false);
        }
      };
      fetchProfileData();
    }
  }, [user, form, toast]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('profilePicture', file, { shouldValidate: true });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (imageFile: File, userId: string): Promise<string> => {
    const fileRef = ref(storage, `avatars/${userId}/${imageFile.name}`);
    await uploadBytes(fileRef, imageFile);
    return await getDownloadURL(fileRef);
  };
  
  async function onSubmit(values: ProfileFormData) {
    if (!user) return;
    setIsSubmitting(true);
    
    try {
      let newImageUrl: string | null = currentAvatarUrl;

      // Handle image upload if a new file is present
      if (values.profilePicture && values.profilePicture instanceof File) {
        newImageUrl = await uploadImage(values.profilePicture, user.uid);
        
        // Delete old image if it exists
        if (currentAvatarUrl) {
          try {
            const oldImageRef = ref(storage, currentAvatarUrl);
            await deleteObject(oldImageRef);
          } catch (storageError: any) {
             if(storageError.code !== 'storage/object-not-found'){
                console.warn("Could not delete old avatar:", storageError);
            }
          }
        }
      }

      const userDocRef = doc(db, 'users', user.uid);
      const ownerDocRef = doc(db, 'rideOwners', user.uid);

      // Update both documents
      await Promise.all([
        updateDoc(userDocRef, {
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          profilePicture: newImageUrl,
        }),
        updateDoc(ownerDocRef, {
          name: values.businessName,
          businessType: values.businessType,
          contactPerson: values.fullName,
          contact: values.email,
        }),
      ]);
      
      setCurrentAvatarUrl(newImageUrl);
      toast({ title: 'Profile Updated Successfully!' });

    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ variant: 'destructive', title: 'Failed to update profile.' });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const ProfileSkeleton = () => (
    <div className="space-y-6">
      <Skeleton className="h-10 w-1/2" />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader><Skeleton className="h-6 w-24" /></CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Skeleton className="h-32 w-32 rounded-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
            </CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  if (isLoading || loadingAuth) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">My Profile</h1>
        <p className="text-muted-foreground">View and manage your business and contact details.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="md:col-span-1">
            <Card>
              <CardHeader><CardTitle>Profile Picture</CardTitle></CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={imagePreview || ''} alt={initialData?.businessName} />
                  <AvatarFallback className="text-4xl">
                    {initialData?.businessName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                 <FormField
                    control={form.control}
                    name="profilePicture"
                    render={() => (
                    <FormItem className="w-full">
                      <FormLabel htmlFor="picture-upload" className="w-full">
                        <Button asChild variant="outline" className="w-full cursor-pointer">
                            <span>
                                <UploadCloud className="mr-2 h-4 w-4" />
                                Upload Image
                            </span>
                        </Button>
                      </FormLabel>
                      <FormControl>
                        <Input 
                            id="picture-upload" 
                            type="file" 
                            accept="image/png, image/jpeg" 
                            className="hidden"
                            onChange={handleImageChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    )}
                 />
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Business Details</CardTitle>
                <CardDescription>Keep your business information up to date.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
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
                 <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl><Input type="email" {...field} /></FormControl>
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
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                 </div>
                 <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                 </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
}
