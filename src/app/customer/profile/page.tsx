
'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, writeBatch, DocumentData } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, UploadCloud, User as UserIcon, Shield, Bell, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { UserNotifications } from '@/components/user-notifications';
import { updatePassword, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';
import { getPublicIdFromUrl } from '@/lib/utils';


const profileFormSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.'),
  phone: z.string().min(10, 'Please enter a valid phone number.'),
  profilePicture: z.any().optional(),
});
type ProfileFormData = z.infer<typeof profileFormSchema>;

const passwordFormSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters.'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ['confirmPassword'],
});
type PasswordFormData = z.infer<typeof passwordFormSchema>;


export default function CustomerProfilePage() {
  const [user, loadingAuth] = useAuthState(auth);
  const router = useRouter();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { fullName: '', phone: '' },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          // Fetch Profile
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const data = {
              fullName: userData.fullName || '',
              phone: userData.phone || '',
              email: userData.email || '',
              profilePicture: userData.profilePicture || null,
            };
            profileForm.reset({ fullName: data.fullName, phone: data.phone });
            if (data.profilePicture) {
              setCurrentAvatarUrl(data.profilePicture);
              setImagePreview(data.profilePicture);
            }
          }
        } catch (error) {
          console.error("Error fetching data:", error);
          toast({ variant: 'destructive', title: 'Failed to load your data.' });
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    } else if (!loadingAuth) {
        router.push('/login');
    }
  }, [user, profileForm, toast, loadingAuth, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      profileForm.setValue('profilePicture', file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onProfileSubmit = async (values: ProfileFormData) => {
    if (!user) return;
    setIsSubmittingProfile(true);
    
    try {
      let newImageUrl: string | null = currentAvatarUrl;
      if (values.profilePicture instanceof File) {
        const arrayBuffer = await values.profilePicture.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64String = buffer.toString('base64');
        
        const uploadOptions = {
            public_id: `avatars/${user.uid}/${Date.now()}-${values.profilePicture.name}`,
            resource_type: 'image' as const,
        };

        const result = await uploadToCloudinary(base64String, uploadOptions);
        newImageUrl = result.secure_url;
        
        if (currentAvatarUrl) {
          const publicId = getPublicIdFromUrl(currentAvatarUrl);
          if (publicId) {
            try { await deleteFromCloudinary(publicId); } catch (e) { console.warn("Old avatar not found or couldn't be deleted", e) }
          }
        }
      }

      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        fullName: values.fullName,
        phone: values.phone,
        profilePicture: newImageUrl,
      });
      
      setCurrentAvatarUrl(newImageUrl);
      toast({ title: 'Profile Updated Successfully!' });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ variant: 'destructive', title: 'Failed to update profile.' });
    } finally {
      setIsSubmittingProfile(false);
    }
  };
  
  const onPasswordSubmit = async (values: PasswordFormData) => {
      if (!user) return;
      setIsSubmittingPassword(true);
      try {
          await updatePassword(user, values.newPassword);
          toast({ title: "Password updated successfully!" });
          passwordForm.reset();
      } catch (error: any) {
          console.error("Error updating password:", error);
          toast({ variant: 'destructive', title: "Password Update Failed", description: "This is a sensitive operation. Please re-login and try again." });
      } finally {
          setIsSubmittingPassword(false);
      }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      // Step 1: Clean up Firestore data
      const batch = writeBatch(db);
      
      // Delete user's main document
      const userDocRef = doc(db, 'users', user.uid);
      batch.delete(userDocRef);

      // Delete user's saved rides
      const savedRidesQuery = query(collection(db, 'savedRides'), where('userId', '==', user.uid));
      const savedRidesSnapshot = await getDocs(savedRidesQuery);
      savedRidesSnapshot.forEach(doc => batch.delete(doc.ref));
      
      // Commit all Firestore deletions
      await batch.commit();

      // Step 2: Delete the user from Firebase Authentication
      // This is the sensitive part that might fail if not recently re-authenticated
      await deleteUser(user);

      toast({ title: 'Account Deleted', description: 'Your account and all associated data have been removed.' });
      router.push('/'); // Redirect to homepage
    } catch (error: any) {
        console.error('Error deleting account:', error);
        
        let description = 'Could not delete your account. Please try again.';
        if (error.code === 'auth/requires-recent-login') {
            description = 'This is a sensitive operation. Please log out, log back in, and then try deleting your account again.';
        }
        
        toast({ variant: 'destructive', title: 'Account Deletion Failed', description });
    }
  };


  if (isLoading || loadingAuth) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-10 w-1/3 mb-6" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
        <div>
            <h1 className="text-3xl font-bold font-headline">My Profile</h1>
            <p className="text-muted-foreground">Manage your account details and preferences.</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile"><UserIcon className="mr-2 h-4 w-4" />Profile</TabsTrigger>
                <TabsTrigger value="security"><Shield className="mr-2 h-4 w-4" />Security</TabsTrigger>
                <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" />Notifications</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Update your photo and personal details here.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                                <FormField
                                    control={profileForm.control}
                                    name="profilePicture"
                                    render={() => (
                                    <FormItem>
                                        <FormLabel>Profile Picture</FormLabel>
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-20 w-20">
                                                <AvatarImage src={imagePreview || ''} alt={profileForm.getValues('fullName')} />
                                                <AvatarFallback><UserIcon className="h-10 w-10" /></AvatarFallback>
                                            </Avatar>
                                            <Button asChild variant="outline" size="sm">
                                                <label htmlFor="picture-upload" className="cursor-pointer">
                                                    <UploadCloud className="mr-2 h-4 w-4" />
                                                    Upload Image
                                                </label>
                                            </Button>
                                            <Input id="picture-upload" type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleImageChange} />
                                        </div>
                                    </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={profileForm.control} name="fullName" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full Name</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={profileForm.control} name="phone" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone Number</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={isSubmittingProfile}>
                                        {isSubmittingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                         </Form>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-6">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Password Management</CardTitle>
                            <CardDescription>Change your password here. It's recommended to use a strong, unique password.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...passwordForm}>
                                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
                                    <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>New Password</FormLabel>
                                            <FormControl><Input type="password" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirm New Password</FormLabel>
                                            <FormControl><Input type="password" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <div className="flex justify-start">
                                        <Button type="submit" disabled={isSubmittingPassword}>
                                            {isSubmittingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Update Password
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                    
                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle className="text-destructive">Delete Account</CardTitle>
                            <CardDescription>
                                Permanently delete your account and all of your content. This action is not reversible.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">
                                        <AlertTriangle className="mr-2 h-4 w-4" />
                                        Delete My Account
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete your account, saved rides, and remove your data from our servers.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-destructive hover:bg-destructive/90"
                                        onClick={handleDeleteAccount}
                                    >
                                        Yes, delete my account
                                    </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
            
            <TabsContent value="notifications" className="mt-6">
                <UserNotifications />
            </TabsContent>
        </Tabs>
    </div>
  );
}
