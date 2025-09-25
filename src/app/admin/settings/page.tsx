
'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Trash2, Database, Edit, Loader2, Save, Book, UploadCloud, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, writeBatch, getDoc, setDoc } from "firebase/firestore";
import { seedableOwners, seedableListings, seedableNotifications, seedableCategories, seedableLocations, seedableSubscriptions, seedableReports, seedableAdvertisements, seedableFaqs } from "@/lib/data";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Separator } from "@/components/ui/separator";

type Category = {
  id: string;
  name: string;
  description?: string;
}

type Location = {
  id: string;
  name: string;
  state?: string;
}

export default function SettingsPage() {
    const { toast } = useToast();
    const [isSeeding, setIsSeeding] = useState(false);
    
    const [categories, setCategories] = useState<Category[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [isLoading, setIsLoading] = useState({ categories: true, locations: true });

    const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);
    const [isLocDialogOpen, setIsLocDialogOpen] = useState(false);
    const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
    const [currentLocation, setCurrentLocation] = useState<Location | null>(null);

    const [publishedPolicy, setPublishedPolicy] = useState('');
    const [draftPolicy, setDraftPolicy] = useState('');
    const [isLoadingPolicy, setIsLoadingPolicy] = useState(true);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [hasDraft, setHasDraft] = useState(false);


    useEffect(() => {
        const unsubCategories = onSnapshot(collection(db, "rideCategories"), (snapshot) => {
            const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            setCategories(cats);
            setIsLoading(prev => ({...prev, categories: false}));
        });

        const unsubLocations = onSnapshot(collection(db, "locations"), (snapshot) => {
            const locs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
            setLocations(locs);
            setIsLoading(prev => ({...prev, locations: false}));
        });

        const fetchPrivacyPolicy = async () => {
            setIsLoadingPolicy(true);
            try {
                const publishedRef = doc(db, 'siteContent', 'privacyPolicy');
                const draftRef = doc(db, 'siteContent', 'privacyPolicy', 'drafts', 'latest');

                const [publishedSnap, draftSnap] = await Promise.all([
                    getDoc(publishedRef),
                    getDoc(draftRef)
                ]);

                const publishedContent = publishedSnap.exists() ? publishedSnap.data().content : 'The privacy policy has not been set yet.';
                setPublishedPolicy(publishedContent);
                
                if (draftSnap.exists()) {
                    setDraftPolicy(draftSnap.data().content);
                    setHasDraft(true);
                } else {
                    setDraftPolicy(publishedContent);
                    setHasDraft(false);
                }

            } catch (error) {
                console.error("Error fetching privacy policy:", error);
                toast({ variant: 'destructive', title: 'Failed to load privacy policy.' });
            } finally {
                setIsLoadingPolicy(false);
            }
        };

        fetchPrivacyPolicy();

        return () => {
            unsubCategories();
            unsubLocations();
        }
    }, [toast]);

    const handleSeedDatabase = async () => {
        setIsSeeding(true);
        try {
            const batch = writeBatch(db);

            seedableOwners.forEach(owner => batch.set(doc(db, 'rideOwners', owner.id), owner));
            seedableListings.forEach(listing => batch.set(doc(db, 'listings', listing.id), listing));
            seedableNotifications.forEach(notification => batch.set(doc(db, 'notifications', notification.id), notification));
            seedableCategories.forEach(category => batch.set(doc(db, 'rideCategories', category.id), { name: category.name, description: category.description }));
            seedableLocations.forEach(location => batch.set(doc(db, 'locations', location.id), { name: location.name, state: location.state }));
            seedableSubscriptions.forEach(sub => batch.set(doc(db, 'subscriptions', sub.id), sub));
            seedableReports.forEach(report => batch.set(doc(db, 'reports', report.id), report));
            seedableAdvertisements.forEach(ad => batch.set(doc(db, 'advertisements', ad.id), ad));
            seedableFaqs.forEach(faq => batch.set(doc(db, 'faqs', faq.id), faq));


            await batch.commit();

            toast({
                title: "Database Seeded",
                description: "Your Firestore database has been populated with sample data.",
            });

        } catch (error) {
             console.error("Error seeding database:", error);
             toast({
                variant: "destructive",
                title: "Seeding Failed",
                description: "Could not seed the database. Check the console for errors.",
            });
        } finally {
            setIsSeeding(false);
        }
    }

    const handleSaveCategory = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        const name = formData.get('name') as string;
        const description = formData.get('description') as string;

        if (!name) {
            toast({ variant: "destructive", title: "Name is required" });
            return;
        }

        try {
            if (currentCategory) { // Editing
                await updateDoc(doc(db, "rideCategories", currentCategory.id), { name, description });
                toast({ title: "Category Updated" });
            } else { // Adding
                await addDoc(collection(db, "rideCategories"), { name, description });
                toast({ title: "Category Added" });
            }
            setIsCatDialogOpen(false);
            setCurrentCategory(null);
        } catch (error) {
            console.error("Error saving category:", error);
            toast({ variant: "destructive", title: "Save Failed" });
        }
    };
    
    const handleDeleteCategory = async (id: string) => {
        try {
            await deleteDoc(doc(db, "rideCategories", id));
            toast({ title: "Category Deleted" });
        } catch (error) {
            console.error("Error deleting category:", error);
            toast({ variant: "destructive", title: "Delete Failed" });
        }
    };

    const handleSaveLocation = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        const name = formData.get('name') as string;
        const state = formData.get('state') as string;

        if (!name) {
            toast({ variant: "destructive", title: "Name is required" });
            return;
        }

        try {
            if (currentLocation) { // Editing
                await updateDoc(doc(db, "locations", currentLocation.id), { name, state });
                toast({ title: "Location Updated" });
            } else { // Adding
                await addDoc(collection(db, "locations"), { name, state });
                toast({ title: "Location Added" });
            }
            setIsLocDialogOpen(false);
            setCurrentLocation(null);
        } catch (error) {
            console.error("Error saving location:", error);
            toast({ variant: "destructive", title: "Save Failed" });
        }
    };

    const handleDeleteLocation = async (id: string) => {
        try {
            await deleteDoc(doc(db, "locations", id));
            toast({ title: "Location Deleted" });
        } catch (error) {
            console.error("Error deleting location:", error);
            toast({ variant: "destructive", title: "Delete Failed" });
        }
    };
    
     const handleSaveDraft = async () => {
        setIsSavingDraft(true);
        try {
            const draftRef = doc(db, 'siteContent', 'privacyPolicy', 'drafts', 'latest');
            await setDoc(draftRef, { content: draftPolicy, updatedAt: new Date() });
            setHasDraft(true);
            toast({ title: 'Draft Saved', description: 'Your changes have been saved as a draft.' });
        } catch (error) {
            console.error('Error saving draft:', error);
            toast({ variant: 'destructive', title: 'Failed to save draft.' });
        } finally {
            setIsSavingDraft(false);
        }
    };
    
    const handlePublish = async () => {
        setIsPublishing(true);
        try {
            const publishedRef = doc(db, 'siteContent', 'privacyPolicy');
            await setDoc(publishedRef, { content: draftPolicy, publishedAt: new Date() });
            setPublishedPolicy(draftPolicy); // Update state to match
            await handleDiscardDraft(false); // Clear the draft after publishing
            toast({ title: 'Privacy Policy Published', description: 'The changes are now live on your site.' });
        } catch (error) {
            console.error('Error publishing policy:', error);
            toast({ variant: 'destructive', title: 'Failed to publish policy.' });
        } finally {
            setIsPublishing(false);
        }
    };
    
    const handleDiscardDraft = async (showToast = true) => {
        try {
            const draftRef = doc(db, 'siteContent', 'privacyPolicy', 'drafts', 'latest');
            await deleteDoc(draftRef);
            setDraftPolicy(publishedPolicy); // Revert editor to published version
            setHasDraft(false);
            if(showToast) {
                toast({ title: 'Draft Discarded', description: 'Your draft changes have been removed.' });
            }
        } catch (error) {
            console.error('Error discarding draft:', error);
            toast({ variant: 'destructive', title: 'Failed to discard draft.' });
        }
    };

    const openCategoryDialog = (category: Category | null = null) => {
        setCurrentCategory(category);
        setIsCatDialogOpen(true);
    };
    
    const openLocationDialog = (location: Location | null = null) => {
        setCurrentLocation(location);
        setIsLocDialogOpen(true);
    };

    return (
        <div className="flex flex-col gap-8">
            <h1 className="text-3xl font-bold font-headline">Settings</h1>

            <Tabs defaultValue="categories">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                    <TabsTrigger value="locations">Locations</TabsTrigger>
                    <TabsTrigger value="policy">Privacy Policy</TabsTrigger>
                    <TabsTrigger value="data">Data</TabsTrigger>
                </TabsList>

                <TabsContent value="categories">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Manage Ride Categories</CardTitle>
                                    <CardDescription>Add, edit, or delete ride categories.</CardDescription>
                                </div>
                                <Button onClick={() => openCategoryDialog()}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Category
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isLoading.categories ? (
                                <div className="space-y-2">
                                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {categories.map(cat => (
                                        <div key={cat.id} className="flex items-center justify-between p-2 rounded-md border">
                                            <div>
                                                <p className="font-medium">{cat.name}</p>
                                                {cat.description && <p className="text-sm text-muted-foreground">{cat.description}</p>}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => openCategoryDialog(cat)}><Edit className="h-4 w-4 mr-2" />Edit</Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete {cat.name}?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. Are you sure you want to permanently delete this category?
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteCategory(cat.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="locations">
                    <Card>
                         <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Manage Locations</CardTitle>
                                    <CardDescription>Add or delete Nigerian cities and towns.</CardDescription>
                                </div>
                                <Button onClick={() => openLocationDialog()}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Location
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isLoading.locations ? (
                                <div className="space-y-2">
                                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                                </div>
                            ) : (
                               <div className="space-y-2">
                                    {locations.map(loc => (
                                        <div key={loc.id} className="flex items-center justify-between p-2 rounded-md border">
                                            <div>
                                                <p className="font-medium">{loc.name}</p>
                                                {loc.state && <p className="text-sm text-muted-foreground">{loc.state}</p>}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => openLocationDialog(loc)}><Edit className="h-4 w-4 mr-2" />Edit</Button>
                                                 <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                     </AlertDialogTrigger>
                                                     <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete {loc.name}?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. Are you sure you want to permanently delete this location?
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteLocation(loc.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="policy">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Privacy Policy Editor</CardTitle>
                                    <CardDescription>Edit the content using Markdown. Changes must be published to go live.</CardDescription>
                                    {hasDraft && <p className="text-sm text-yellow-600 mt-2">You have unpublished draft changes.</p>}
                                </div>
                                 <div className="flex gap-2">
                                    {hasDraft && 
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="outline" disabled={isSavingDraft || isPublishing}>
                                                    <RotateCcw className="mr-2 h-4 w-4" />
                                                    Discard Draft
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Discard all draft changes?</AlertDialogTitle>
                                                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDiscardDraft()}>Discard</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    }
                                    <Button onClick={handleSaveDraft} variant="secondary" disabled={isSavingDraft || isPublishing}>
                                        {isSavingDraft ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        {isSavingDraft ? 'Saving...' : 'Save Draft'}
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button disabled={isPublishing || isSavingDraft || !hasDraft}>
                                                {isPublishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                                                {isPublishing ? 'Publishing...' : 'Publish'}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Publish changes to the live site?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will make the current draft visible to all users. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handlePublish}>Publish Changes</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                 </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                           {isLoadingPolicy ? (
                                <Skeleton className="w-full h-96" />
                           ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="policy-editor" className="text-sm font-medium">Editor (Markdown)</Label>
                                        <Textarea
                                            id="policy-editor"
                                            value={draftPolicy}
                                            onChange={(e) => setDraftPolicy(e.target.value)}
                                            rows={25}
                                            placeholder="Enter your privacy policy content here..."
                                            className="font-mono text-sm mt-2"
                                        />
                                    </div>
                                    <div className="border rounded-md">
                                         <Label className="text-sm font-medium px-4 pt-3 block">Live Preview</Label>
                                        <div className="p-4 prose prose-sm prose-p:text-foreground prose-h1:text-foreground prose-h2:text-foreground prose-h3:text-foreground prose-h4:text-foreground prose-a:text-primary max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {draftPolicy}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                           )}
                        </CardContent>
                    </Card>
                </TabsContent>

                 <TabsContent value="data">
                    <Card>
                        <CardHeader>
                            <CardTitle>Database Management</CardTitle>
                            <CardDescription>Use sample data to populate your database for testing.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-md border border-destructive/50">
                                <div>
                                    <h4 className="font-semibold">Seed Database</h4>
                                    <p className="text-sm text-muted-foreground">Populate Firestore with sample data. This will overwrite existing sample data.</p>
                                </div>
                                <Button variant="destructive" onClick={handleSeedDatabase} disabled={isSeeding}>
                                    {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                                    {isSeeding ? 'Seeding...' : 'Seed Data'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Category Dialog */}
            <Dialog open={isCatDialogOpen} onOpenChange={setIsCatDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentCategory ? 'Edit' : 'Add'} Category</DialogTitle>
                        <DialogDescription>
                           {currentCategory ? 'Update the details for this category.' : 'Create a new ride category for your platform.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveCategory} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="cat-name">Category Name</Label>
                            <Input id="cat-name" name="name" defaultValue={currentCategory?.name} placeholder="e.g., VIP" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cat-desc">Description (Optional)</Label>
                            <Input id="cat-desc" name="description" defaultValue={currentCategory?.description} placeholder="e.g., Premium, luxury vehicles" />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Location Dialog */}
            <Dialog open={isLocDialogOpen} onOpenChange={setIsLocDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentLocation ? 'Edit' : 'Add'} Location</DialogTitle>
                        <DialogDescription>
                           {currentLocation ? 'Update the details for this location.' : 'Add a new Nigerian city or town.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveLocation} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="loc-name">Location Name</Label>
                            <Input id="loc-name" name="name" defaultValue={currentLocation?.name} placeholder="e.g., Port Harcourt" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="loc-state">State (Optional)</Label>
                            <Input id="loc-state" name="state" defaultValue={currentLocation?.state} placeholder="e.g., Rivers" />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

