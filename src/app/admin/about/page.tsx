
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, UploadCloud, PlusCircle, Trash2, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


type AboutUsContent = {
    mission: string;
    vision: string;
    values: string[];
    howItWorks: string[];
    whyChooseUs: string[];
}

const defaultContent: AboutUsContent = {
    mission: '',
    vision: '',
    values: [''],
    howItWorks: [''],
    whyChooseUs: [''],
}

export default function AboutUsEditorPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    
    const [draft, setDraft] = useState<AboutUsContent>(defaultContent);
    const [published, setPublished] = useState<AboutUsContent>(defaultContent);
    const [hasDraft, setHasDraft] = useState(false);

    const { toast } = useToast();
    
    useEffect(() => {
        const fetchContent = async () => {
            setIsLoading(true);
            try {
                const aboutUsRef = doc(db, 'siteContent', 'aboutUs');
                const docSnap = await getDoc(aboutUsRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const publishedData = data.publishedVersion || defaultContent;
                    const draftData = data.draftVersion || publishedData;
                    
                    setPublished(publishedData);
                    setDraft(draftData);
                    
                    // A simple JSON diff to check if a draft exists
                    setHasDraft(JSON.stringify(draftData) !== JSON.stringify(publishedData));

                } else {
                    // Set both to default if document doesn't exist
                    setPublished(defaultContent);
                    setDraft(defaultContent);
                }
            } catch (error) {
                console.error("Error fetching 'About Us' content:", error);
                toast({ variant: 'destructive', title: 'Failed to load content.' });
            } finally {
                setIsLoading(false);
            }
        }
        fetchContent();
    }, [toast]);
    
    const handleValueChange = <K extends keyof AboutUsContent>(field: K, value: AboutUsContent[K]) => {
        setDraft(prev => ({...prev, [field]: value}));
    };

    const handleAddListItem = (field: keyof AboutUsContent) => {
        setDraft(prev => ({
            ...prev,
            [field]: [...(prev[field] as string[]), '']
        }));
    };
    
    const handleRemoveListItem = (field: keyof AboutUsContent, index: number) => {
        setDraft(prev => ({
            ...prev,
            [field]: (prev[field] as string[]).filter((_, i) => i !== index)
        }));
    };

    const handleListItemChange = (field: keyof AboutUsContent, index: number, value: string) => {
        setDraft(prev => {
            const newList = [...(prev[field] as string[])];
            newList[index] = value;
            return { ...prev, [field]: newList };
        });
    };

    const handleSaveDraft = async () => {
        setIsSaving(true);
        try {
            const aboutUsRef = doc(db, 'siteContent', 'aboutUs');
            await setDoc(aboutUsRef, { draftVersion: draft }, { merge: true });
            setHasDraft(true);
            toast({ title: 'Draft Saved Successfully' });
        } catch (error) {
            console.error('Error saving draft:', error);
            toast({ variant: 'destructive', title: 'Failed to save draft.' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handlePublish = async () => {
        setIsPublishing(true);
        try {
            const aboutUsRef = doc(db, 'siteContent', 'aboutUs');
            await setDoc(aboutUsRef, {
                publishedVersion: draft,
                draftVersion: draft, // Sync draft and published on publish
                updatedAt: serverTimestamp()
            }, { merge: true });

            setPublished(draft);
            setHasDraft(false);
            toast({ title: 'Content Published!', description: 'The About Us page is now live with your changes.' });
        } catch (error) {
            console.error('Error publishing:', error);
            toast({ variant: 'destructive', title: 'Failed to publish content.' });
        } finally {
            setIsPublishing(false);
        }
    };
    
    const handleDiscardDraft = () => {
        setDraft(published);
        setHasDraft(false);
        toast({ title: 'Draft Discarded', description: 'Your changes have been reverted to the last published version.' });
    }

    const DynamicListSection = ({ title, items, fieldName }: { title: string, items: string[], fieldName: keyof AboutUsContent }) => (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                 <Label>{title}</Label>
                 <Button type="button" size="sm" variant="ghost" onClick={() => handleAddListItem(fieldName)}><PlusCircle className="mr-2 h-4 w-4" /> Add Item</Button>
            </div>
            {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                    <Input value={item} onChange={e => handleListItemChange(fieldName, index, e.target.value)} placeholder={`Item ${index + 1}`} />
                    <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => handleRemoveListItem(fieldName, index)}><Trash2 className="h-4 w-4" /></Button>
                </div>
            ))}
        </div>
    );
    
    if (isLoading) {
        return (
             <div className="space-y-8">
                <Skeleton className="h-10 w-1/3" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </div>
                    <div className="lg:col-span-1">
                        <Skeleton className="h-96 w-full" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">About Us Editor</h1>
                    <p className="text-muted-foreground">Manage the content displayed on your public 'About Us' page.</p>
                </div>
                <div className="flex gap-2">
                    {hasDraft &&
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" disabled={isSaving || isPublishing}>
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
                                    <AlertDialogAction onClick={handleDiscardDraft}>Discard</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    }
                    <Button variant="secondary" onClick={handleSaveDraft} disabled={isSaving || isPublishing}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSaving ? 'Saving...' : 'Save Draft'}
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button disabled={isPublishing || isSaving || !hasDraft}>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Core Content</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="mission">Our Mission</Label>
                                <Textarea id="mission" value={draft.mission} onChange={e => handleValueChange('mission', e.target.value)} placeholder="To connect people with safe, reliable, and affordable transportation..." rows={3} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="vision">Our Vision</Label>
                                <Textarea id="vision" value={draft.vision} onChange={e => handleValueChange('vision', e.target.value)} placeholder="To be the leading ride-sharing platform in Nigeria..." rows={3} />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Detailed Sections</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <DynamicListSection title="Our Values" items={draft.values} fieldName="values" />
                            <DynamicListSection title="How It Works (Steps)" items={draft.howItWorks} fieldName="howItWorks" />
                            <DynamicListSection title="Why Choose Us" items={draft.whyChooseUs} fieldName="whyChooseUs" />
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                     <Card>
                        <CardHeader>
                            <CardTitle>Live Preview</CardTitle>
                            <CardDescription>This is how the content will appear on the page.</CardDescription>
                        </CardHeader>
                        <CardContent className="prose prose-sm max-w-none">
                            <h3 className="font-bold">Mission</h3>
                            <p>{draft.mission || "Mission preview..."}</p>
                             <h3 className="font-bold mt-4">Vision</h3>
                            <p>{draft.vision || "Vision preview..."}</p>
                            <h3 className="font-bold mt-4">Values</h3>
                            <ul className="list-disc pl-5">
                                {draft.values.map((v, i) => (v ? <li key={i}>{v}</li> : null))}
                            </ul>
                             <h3 className="font-bold mt-4">How It Works</h3>
                            <ol className="list-decimal pl-5">
                                {draft.howItWorks.map((step, i) => (step ? <li key={i}>{step}</li> : null))}
                            </ol>
                            <h3 className="font-bold mt-4">Why Choose Us</h3>
                             <ul className="list-disc pl-5">
                                {draft.whyChooseUs.map((reason, i) => (reason ? <li key={i}>{reason}</li> : null))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
