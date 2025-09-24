
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NIGERIAN_CITIES } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, Car, Upload, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const vehicleTypes = ['Car', 'Bus', 'Keke', 'Bike', 'VIP'];

const formSchema = z.object({
  name: z.string().min(3, 'Vehicle name must be at least 3 characters.'),
  type: z.string().min(1, 'Please select a vehicle type.'),
  location: z.string().min(1, 'Please select a location.'),
  price: z.coerce.number().min(0, 'Price must be a positive number.'),
  phone: z.string().min(10, 'Please enter a valid phone number.'),
  whatsapp: z.string().optional(),
  schedule: z.string().min(3, 'Please enter an availability schedule.'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1.'),
  modelYear: z.string().min(4, 'Please enter a valid year.'),
  companyName: z.string().optional(),
  description: z.string().optional(),
  altContact: z.string().optional(),
  image: z.any().refine((file) => file, 'Vehicle image is required.'),
});

type FormData = z.infer<typeof formSchema>;

export default function AddListingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: '',
      location: '',
      price: 0,
      phone: '',
      schedule: '',
      capacity: 1,
      modelYear: '',
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('image', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeImage = () => {
      form.setValue('image', null);
      setImagePreview(null);
  }

  async function onSubmit(values: FormData) {
    setIsSubmitting(true);
    try {
      // NOTE: In a real app, you'd upload the image to Firebase Storage first
      // and get the download URL. For this demo, we are skipping the upload.
      // const imageUrl = await uploadImage(values.image);

      await addDoc(collection(db, 'listings'), {
        name: values.name,
        type: values.type,
        pickup: values.location, // Assuming location is the pickup point
        destination: '', // Admin-added listings might not have a fixed destination
        price: values.price,
        owner: values.companyName || 'Admin', // Use company name or 'Admin'
        model: `${values.name} ${values.modelYear}`,
        contact: {
            phone: values.phone,
            whatsapp: values.whatsapp,
        },
        schedule: values.schedule,
        capacity: values.capacity,
        description: values.description,
        altContact: values.altContact,
        // image: imageUrl, // Use the URL from storage
        image: 'sedan-1', // Placeholder
        isPromoted: false,
        status: 'Approved', // Admin-added listings are pre-approved
        postedBy: 'admin',
        createdAt: serverTimestamp(),
      });

      toast({
        title: 'Listing Added',
        description: 'The new vehicle has been successfully added.',
      });
      router.push('/admin/listings');
    } catch (error) {
      console.error('Error adding document: ', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Could not add the vehicle. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon">
                <Link href="/admin/listings">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Link>
            </Button>
            <h1 className="text-3xl font-bold font-headline">Add New Vehicle Listing</h1>
        </div>

        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Vehicle Details</CardTitle>
                                <CardDescription>Provide the main information about the vehicle.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Vehicle Title / Name</FormLabel>
                                            <FormControl><Input placeholder="e.g., Toyota Camry 2021" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                     <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Vehicle Type</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {vehicleTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="location"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Location</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a city" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {NIGERIAN_CITIES.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="modelYear"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Model / Year</FormLabel>
                                                <FormControl><Input placeholder="e.g., 2021" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="price"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Price (₦)</FormLabel>
                                                <FormControl><Input type="number" placeholder="e.g., 15000" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                 <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description / Notes</FormLabel>
                                            <FormControl><Textarea placeholder="e.g., Air-conditioned, spacious, available for long trips." {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Contact & Availability</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone Number</FormLabel>
                                                <FormControl><Input placeholder="e.g., 2348012345678" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="whatsapp"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>WhatsApp (Optional)</FormLabel>
                                                <FormControl><Input placeholder="e.g., 2348012345678" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="schedule"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Availability / Schedule</FormLabel>
                                            <FormControl><Input placeholder="e.g., Mon-Fri, 9am-5pm" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="altContact"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Alternate Contact (Optional)</FormLabel>
                                            <FormControl><Input placeholder="Secondary phone, email, or website" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>
                    <div className="space-y-8">
                         <Card>
                            <CardHeader><CardTitle>Vehicle Photo</CardTitle></CardHeader>
                            <CardContent>
                                <FormField
                                    control={form.control}
                                    name="image"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="sr-only">Vehicle Photo</FormLabel>
                                            <FormControl>
                                                <div className="flex flex-col items-center justify-center w-full">
                                                    <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted">
                                                        {imagePreview ? (
                                                            <div className="relative w-full h-full">
                                                                <Image src={imagePreview} alt="Preview" fill className="object-contain rounded-lg" />
                                                                <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={(e) => {e.preventDefault(); removeImage(); }}>
                                                                    <X className="h-4 w-4"/>
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                                <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p>
                                                                <p className="text-xs text-muted-foreground">PNG, JPG or GIF</p>
                                                            </div>
                                                        )}
                                                    </label>
                                                    <Input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="capacity"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Capacity / Seats</FormLabel>
                                            <FormControl><Input type="number" placeholder="e.g., 4" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="companyName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company Name (Optional)</FormLabel>
                                            <FormControl><Input placeholder="e.g., Admin Rides Co." {...field} /></FormControl>
                                            <FormDescription>If this vehicle belongs to a company.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Adding...' : 'Add Vehicle'}
                    </Button>
                </div>
            </form>
        </Form>
    </div>
  );
}

