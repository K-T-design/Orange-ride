
'use client';

import { useEffect, useState } from "react";
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2, Megaphone, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";

type Ad = {
  id: string;
  imageUrl: string;
  description: string;
  link?: string;
  isActive: boolean;
};

export default function ManageAdsPage() {
    const [ads, setAds] = useState<Ad[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [link, setLink] = useState('');

    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "advertisements"), (snapshot) => {
            const adsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad));
            setAds(adsData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const clearForm = () => {
        setDescription('');
        setImageUrl('');
        setLink('');
    }

    const handleAddAd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageUrl || !description) {
            toast({ variant: "destructive", title: "Image URL and description are required." });
            return;
        }
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "advertisements"), {
                imageUrl,
                description,
                link,
                isActive: true,
                createdAt: serverTimestamp(),
            });
            toast({ title: "Advertisement Added" });
            setIsDialogOpen(false);
            clearForm();
        } catch (error) {
            console.error("Error adding ad:", error);
            toast({ variant: "destructive", title: "Failed to add advertisement." });
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

    const handleDeleteAd = async (adId: string) => {
        const adRef = doc(db, 'advertisements', adId);
        try {
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
                <Button onClick={() => setIsDialogOpen(true)}>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {ads.map((ad) => (
                                <Card key={ad.id} className="overflow-hidden">
                                    <div className="relative aspect-video">
                                        <Image src={ad.imageUrl} alt={ad.description} fill className="object-cover" />
                                    </div>
                                    <CardContent className="p-4">
                                        <p className="text-sm text-muted-foreground truncate">{ad.description}</p>
                                        {ad.link && <a href={ad.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block">{ad.link}</a>}
                                    </CardContent>
                                    <div className="p-4 bg-muted/50 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={ad.isActive}
                                                onCheckedChange={() => handleToggleStatus(ad)}
                                                aria-label="Toggle ad status"
                                            />
                                            <Label htmlFor="status">{ad.isActive ? 'Active' : 'Inactive'}</Label>
                                        </div>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>This will permanently delete the ad.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteAd(ad.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Advertisement</DialogTitle>
                        <DialogDescription>
                           Upload an image and provide details for the new ad.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddAd} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="imageUrl">Image URL</Label>
                            <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://picsum.photos/seed/ad1/600/400" required />
                            <p className="text-xs text-muted-foreground">For this demo, please use an image URL. Firebase Storage upload is not implemented.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Get 20% off your next ride!" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="link">Link (Optional)</Label>
                            <Input id="link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://example.com/promo" />
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
