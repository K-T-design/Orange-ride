
'use client';

import { useEffect, useState } from "react";
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2, Megaphone, Loader2, Edit, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";
import { getPublicIdFromUrl } from "@/lib/utils";

type Ad = {
  id: string;
  imageUrl: string;
  description: string;
  link?: string;
  isActive: boolean;
  priority?: number;
};

export default function ManageAdsPage() {
    const [ads, setAds] = useState<Ad[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentAd, setCurrentAd] = useState<Ad | null>(null);
    
    // Form state
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [link, setLink] = useState('');
    const [priority, setPriority] = useState(0);

    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "advertisements"), (snapshot) => {
            const adsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad));
            setAds(adsData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);
    
    useEffect(() => {
        if (currentAd) {
            setDescription(currentAd.description);
            setLink(currentAd.link || '');
            setPriority(currentAd.priority || 0);
            setImagePreview(currentAd.imageUrl);
            setImageFile(null); // Clear file input when editing
        } else {
            clearForm();
        }
    }, [currentAd]);


    const clearForm = () => {
        setDescription('');
        setLink('');
        setPriority(0);
        setImageFile(null);
        setImagePreview(null);
        setCurrentAd(null);
    }
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB validation
                toast({ variant: "destructive", title: "Image too large", description: "Please upload an image smaller than 5MB."});
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };
    
    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const openDialog = (ad: Ad | null) => {
        setCurrentAd(ad);
        setIsDialogOpen(true);
    }

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!description) {
            toast({ variant: "destructive", title: "Description is required." });
            return;
        }
        
        // Image is required for new ads, but not when editing an existing one
        if (!currentAd && !imageFile) {
             toast({ variant: "destructive", title: "Image is required." });
             return;
        }

        setIsSubmitting(true);
        try {
            let finalImageUrl = currentAd?.imageUrl;

            // If a new image is selected, upload it
            if (imageFile) {
                 const arrayBuffer = await imageFile.arrayBuffer();
                 const buffer = Buffer.from(arrayBuffer);
                 const base64String = buffer.toString('base64');
                 
                 const uploadResult = await uploadToCloudinary(base64String, {
                    public_id: `advertisements/${Date.now()}_${imageFile.name}`,
                    resource_type: 'image'
                 });
                 finalImageUrl = uploadResult.secure_url;

                 // If we are editing and there was an old image, delete it
                 if (currentAd && currentAd.imageUrl) {
                    const oldPublicId = getPublicIdFromUrl(currentAd.imageUrl);
                    if (oldPublicId) {
                        try {
                           await deleteFromCloudinary(oldPublicId);
                        } catch (e) {
                            console.warn("Old image could not be deleted:", e);
                        }
                    }
                 }
            }
            
            if (!finalImageUrl) {
                throw new Error("Image URL is missing.");
            }

            const adData = {
                imageUrl: finalImageUrl,
                description,
                link: link || null,
                priority: priority || 0,
            };

            if (currentAd) { // Editing existing ad
                const adRef = doc(db, 'advertisements', currentAd.id);
                await updateDoc(adRef, adData);
                toast({ title: "Advertisement Updated" });
            } else { // Adding new ad
                await addDoc(collection(db, "advertisements"), {
                    ...adData,
                    isActive: true,
                    createdAt: serverTimestamp(),
                });
                toast({ title: "Advertisement Added" });
            }
            setIsDialogOpen(false);
            clearForm();
        } catch (error) {
            console.error("Error saving ad:", error);
            toast({ variant: "destructive", title: "Failed to save advertisement." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStatus = async (ad: Ad) => {
        const adRef = doc(db, 'advertisements', ad.id);
        try {
            await updateDoc(adRef, { isActive: !ad.isActive });
            toast({ title: `Ad ${ad.isActive ? 'deactivated' : 'activated'}.` });
        } catch (error) {
            console.error("Error toggling status:", error);
            toast({ variant: "destructive", title: "Failed to update status." });
        }
    };

    const handleDeleteAd = async (ad: Ad) => {
        const adRef = doc(db, 'advertisements', ad.id);
        try {
            // Delete image from Cloudinary first
            if (ad.imageUrl) {
                const publicId = getPublicIdFromUrl(ad.imageUrl);
                if (publicId) {
                    await deleteFromCloudinary(publicId);
                }
            }
            // Then delete Firestore document
            await deleteDoc(adRef);
            toast({ title: "Advertisement Deleted" });
        } catch (error) {
            console.error("Error deleting ad:", error);
            toast({ variant: "destructive", title: "Failed to delete advertisement." });
        }
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">Manage Advertisements</h1>
                <Button onClick={() => openDialog(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Ad
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Advertisements</CardTitle>
                    <CardDescription>Manage promotional ads shown on the homepage.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : ads.length === 0 ? (
                        <div className="text-center py-12">
                            <Megaphone className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">No advertisements found</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Add a new ad to get started.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Image</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ads.map((ad) => (
                                    <TableRow key={ad.id}>
                                        <TableCell>
                                             <div className="relative h-16 w-28 rounded-md bg-muted">
                                                <Image src={ad.imageUrl} alt={ad.description} layout="fill" className="object-cover rounded-md" />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{ad.description}</div>
                                            {ad.link && <a href={ad.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block">{ad.link}</a>}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{ad.priority || 0}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={ad.isActive}
                                                    onCheckedChange={() => handleToggleStatus(ad)}
                                                    aria-label="Toggle ad status"
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <AlertDialog>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onSelect={() => openDialog(ad)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>This will permanently delete the ad.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteAd(ad)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { setIsDialogOpen(isOpen); if (!isOpen) clearForm(); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentAd ? 'Edit' : 'Add New'} Advertisement</DialogTitle>
                        <DialogDescription>
                           Provide details for the advertisement.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleFormSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Image</Label>
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
                                            <p className="text-xs text-muted-foreground">PNG, JPG, or JPEG (MAX 5MB)</p>
                                        </div>
                                    )}
                                </label>
                                <Input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Get 20% off your next ride!" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="link">Link (Optional)</Label>
                            <Input id="link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://example.com/promo" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Input id="priority" type="number" value={priority} onChange={(e) => setPriority(Number(e.target.value))} placeholder="0" />
                            <p className="text-xs text-muted-foreground">Higher numbers show first. Default is 0.</p>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSubmitting ? 'Saving...' : 'Save Ad'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

  